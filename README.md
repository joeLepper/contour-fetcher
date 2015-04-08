FM Contour Fetcher
==================

This module fetches FM contour data from the FCC, inflates it, parses it, and seeds an instance of levelDB.

Use
---

```javascript
var app = require('./')

app(function (err, db) {
  if (err) return console.log('fetch init error ', err)
  // do magic
})
```