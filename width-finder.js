var levelup = require('level')

levelup('./contours', { valueEncoding: 'json' }, function (err, db) {
  var start = Date.now()
  var maxWidth = 0
  var maxHeight = 0
  var maxRadius = 0
  db.createValueStream()
  .on('data', function (value) {
    var width = 0
    var height = 0
    var radius = 0
    var center = value.properties.transmitter

    value.geometry.coordinates.forEach(function (coords) {
      if (coords[0] !== null && coords[1] !== null) {
        var curHeight = Math.abs(Math.abs(center[0]) - Math.abs(coords[0]))
        var curWidth = Math.abs(Math.abs(center[1]) - Math.abs(coords[1]))

        if (curHeight > height) height = curHeight
        if (curWidth > width) width = curWidth
        if (curHeight > radius) radius = curHeight
        if (curWidth > radius) radius = curWidth
      }
    })
    if (height > maxHeight) maxHeight = height
    if (width > maxWidth) maxWidth = width
    if (radius > maxRadius) maxRadius = radius
  })
  .on('close', function () {
    console.log('maxWidth: ', maxWidth)
    console.log('maxHeight: ', maxHeight)
    console.log('maxRadius: ', maxRadius)
  })
})