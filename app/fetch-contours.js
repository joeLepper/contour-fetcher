var request = require('request')
var unzip = require('unzip')
var csv = require('csv-streamify')
var formatFetcher = require('./fetch-formats')
var i = 0

module.exports = function (db, cb) {
  console.log('fetching contours')
  fetch = formatFetcher(db)
  var stations = {}
  var parser = csv({ objectMode: true, delimiter: '|' })

  parser.on('data', function (rawContour) {
    var callSignArr = rawContour[2].split(' ')
    var transmitterArr = rawContour[3].split(',')
    var transmitter = [+transmitterArr[0], +transmitterArr[1]]
    var polygon = rawContour.slice(4, -1).map(function (point) {
      var pointArr = point.split(',')
      return [+pointArr[0], +pointArr[1]]
    })

    var callSign = callSignArr[0]
    var station = (
      { applicationId: +rawContour[0]
      , stationType: rawContour[1]
      , callSign: callSign
      , applicationFileNumber: callSignArr[1]
      , transmitter: transmitter
      , polygon: polygon
      }
    )
    stations[callSign] = station

    var newStations = Object.keys(stations).length
    if (newStations === 50) {
      fetch(stations)
      stations = {}
      i += newStations
      // console.log(i + ' new stations parsed from zip')
    }
  })

  parser.on('end', function () { fetch(stations) })

  request.get('http://transition.fcc.gov/ftp/Bureaus/MB/Databases/fm_service_contour_data/FM_service_contour_current.zip')
    .pipe(unzip.Parse())
    .on('entry', function (entry) { entry.pipe(parser) })
}
