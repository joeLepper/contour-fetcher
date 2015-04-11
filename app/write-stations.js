var geo = require('geojson')
var totalWritten = 0

module.exports = function (stations, db) {
  var actions = []
  stations.forEach(function (station) {
    if (typeof station !== 'undefined') {
      actions.push(
        { type: 'put'
        , key: 'lat~' + station.transmitter[0]
        , value: geo.parse([station]
          , { Polygon: 'polygon' }
          ).features[0]
        }
      )
      actions.push(
        { type: 'put'
        , key: 'lng~' + station.transmitter[1]
        , value: geo.parse([station]
          , { Polygon: 'polygon' }
          ).features[0]
        }
      )
    }
  })
  db.batch(actions, function (err) {
    totalWritten += actions.length / 2
    console.log(totalWritten + ' stations written.')
  })
}
