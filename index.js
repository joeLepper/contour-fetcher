var levelup = require('level')
var fetchContours = require('./app/fetch-contours')

module.exports = function (cb) {
  levelup('./contours'
  , { valueEncoding: 'json' }
  , function (err, db) {
      if (err) return console.log(err)
      clock(db)
      cb(err, db)
    }
  )
}

function clock (db) {
  fetchContours(db, function (err) {
    if (err) {
      console.log('fetch error, trying again')
      console.log(err)
      clock(db)
    }
    else {
      console.log('contours updated')
      setTimeout(function () { clock(db) }, 3600000)
    }
  })
}
