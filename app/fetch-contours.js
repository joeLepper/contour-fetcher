var request = require('request')
var unzip = require('unzip')
var csv = require('csv-streamify')
var geo = require('geojson')

module.exports = function (db, cb) {
  console.log('fetching contours')
  var actions = []
  var parser = csv({ objectMode: true, delimiter: '|' })

  parser.on('data', function (rawContour) {
    var callSignArr = rawContour[2].split(' ')
    var transmitterArr = rawContour[3].split(',')
    var transmitter = [+transmitterArr[0], +transmitterArr[1]]
    var polygon = rawContour.slice(4, -1).map(function (point) {
      var pointArr = point.split(',')
      return [+pointArr[0], +pointArr[1]]
    })

    var contour = (
      { applicationId: +rawContour[0]
      , stationType: rawContour[1]
      , callSign: callSignArr[0]
      , applicationFileNumber: callSignArr[1]
      , transmitter: transmitter
      , polygon: polygon
      }
    )

    actions.push(
      { type: 'put'
      , key: 'lat~' + contour.transmitter[0]
      , value: geo.parse([contour]
      , { Polygon: 'polygon' }).features[0]
      }
    )

    actions.push(
      { type: 'put'
      , key: 'lng~' + contour.transmitter[1]
      , value: geo.parse([contour]
      , { Polygon: 'polygon' }).features[0]
      }
    )
  })

  parser.on('end', function () {
    console.log('finished')
    db.batch(actions, function (err) {
      console.log('batch contour write finished')
      cb(err)
    })
  })

  request.get('http://transition.fcc.gov/ftp/Bureaus/MB/Databases/fm_service_contour_data/FM_service_contour_current.zip')
    .pipe(unzip.Parse())
    .on('entry', function (entry) {
      entry.pipe(parser)
    })
}
