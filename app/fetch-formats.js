var request = require('request')
var agent = require('http').Agent
var write = require('./write-stations')
var totalUpdated = 0


agent.maxSockets = Infinity

module.exports = function (db) {
  return function (stations, cb) {
    Object.keys(stations).forEach(function (callSign) { if (callSign.indexOf('NEW') !== -1) delete stations[callSign] })
    updateFormats(stations)
  }
  function updateFormats (stations) {
    // console.log('trying to update the format of ' + Object.keys(stations).length + ' stations.')
    var query = 'http://en.wikipedia.org/w/api.php?format=json&action=query&titles=' + Object.keys(stations).join('|') + '&prop=revisions&rvprop=content'

    request.get(query, function (err, response, body) {
      var stationArr = []
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
            })
          }
          stationArr.push(station)
          delete stations[page.title]
        })
        Object.keys(stations).forEach(function (key) { if (typeof stations[key] !== 'undefined') stationArr.push(stations[key]) })
        write(stationArr, db)
      }
    })
  }
}
