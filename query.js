var geoUtils = require('geojson-utils')
var levelup = require('level')

levelup('./contours', { valueEncoding: 'json' }, function (err, db) {
  var start = Date.now()
  var i = 0
  db.createValueStream()
  .on('data', function (d) {
    if (d.properties.callSign.indexOf('KDLO-FM') !== -1) console.log(d)
    i++
  })
  .on('close', function () { console.log(i) })
})