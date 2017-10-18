var tape = require('tape')
var pull = require('pull-stream')
var through = require('pull-through')
var ssbKeys = require('ssb-keys')

var createSbot = require('scuttlebot')
      .use(require('scuttlebot/plugins/master'))

var db = require('../db.js')

const common = { title: 'The moon is a harsh mistress', author: 'Robert A. Heinlein' }
const subjective = { rating: 5, 'rating-type': 'stars', read: Date.now() }

function getSbot()
{
  return createSbot({
    temp: 'test-write' + Math.random(),
    keys: ssbKeys.generate()
  })
}

tape('simple create', function (t) {
  var sbot = getSbot()

  var bookDB = db.bookDB(sbot)
  bookDB.create(common, subjective, (err, msg) => {
    pull(
      sbot.messagesByType({ type: "bookclub", fillCache: true, keys: false }),
      pull.collect((err, data) => {
        t.deepEqual(data[0].content.common, common, "message correctly stored in database")
        t.deepEqual(data[0].content.subjective, subjective, "message correctly stored in database")
        t.end()
        sbot.close()
      })
    )
  })
})

tape('simple amend', function (t) {
  var sbot = getSbot()

  var bookDB = db.bookDB(sbot)
  bookDB.create(common, subjective, (err, msg) => {
    const newSubj = { rating: 4 }
    bookDB.amend(msg.key, null, newSubj, (err, msg) => {
      bookDB.getAll(books => {
        t.deepEqual(books[0].common, common, "book common amended correctly")
        t.deepEqual(books[0].subjective[msg.value.author], Object.assign(subjective, newSubj),
                    "book subjective updated correctly")
        t.end()
        sbot.close()
      })
    })
  })
})
