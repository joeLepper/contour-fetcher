var levelup = require('level')
var request = require('request')
var agent = require('http').Agent

var totalUpdated = 0

agent.maxSockets = Infinity

levelup('./contours', { valueEncoding: 'json' }, function (err, db) {
  var start = Date.now()
  var i = 0
  var stations = {}

  db.createReadStream()
  .on('data', function (station) {
    var callSign = station.value.properties.callSign
    if (callSign.indexOf('NEW') === -1) {
      i++
      stations[callSign] = station
    }

    if (i === 50) {
      updateFormats(stations, db)
      i = 0
      stations = {}
    }
  })
  .on('close', function () { updateFormats(stations, db) })
})

function updateFormats (stations, db) {
  var query = 'http://en.wikipedia.org/w/api.php?format=json&action=query&titles=' + Object.keys(stations).join('|') + '&prop=revisions&rvprop=content'

  request.get(query, function (err, response, body) {
    var actions = []
    if (!err && response.statusCode === 200) {
      var query = JSON.parse(body).query
      Object.keys(query.pages).forEach(function (key) {
        var page = query.pages[key]
        if (key.indexOf('-') === -1) {
          var station = stations[page.title]
          page.revisions[0]['*'].split('\n').forEach(function (infoRow) {
            if (infoRow.indexOf('| frequency') !== -1) {
              var stationRow = infoRow.split('= ')
              if (stationRow.length === 2 && typeof stationRow[1] !== 'undefined') station.frequency = { value: stationRow[1].split(' ')[0], unit: 'MHz' }
            }
            if (infoRow.indexOf('| format') !== -1) {
              var formatRow = infoRow.split('= ')
              if (formatRow.length === 2 && typeof formatRow[1] !== 'undefined') station.format = formatRow[1].match(/([^\[\|\]][A-z])\w+/g)
            }
            if (infoRow.indexOf('| website') !== -1) {
              var webRow = infoRow.split('= ')
              if (webRow.length === 2 && typeof webRow[1] !== 'undefined') station.website = webRow[1].match(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi)
            }

            actions.push(
              { type: 'put'
              , key: station.key
              , value: station.value
              }
            )
          })
        }
      })
      db.batch(actions, function (err) {
        if (err) console.log(err)
        else {
          totalUpdated += actions.length
          console.log(totalUpdated + ' stations successfully updated.')
        }
      })
    }
  })
}
