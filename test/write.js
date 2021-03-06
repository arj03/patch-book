var tape = require('tape')
var pull = require('pull-stream')
var through = require('pull-through')
var ssbKeys = require('ssb-keys')

var createSbot = require('scuttlebot')
      .use(require('scuttlebot/plugins/master'))

var db = require('../db.js')

const common = { title: 'The moon is a harsh mistress', authors: 'Robert A. Heinlein' }
const subjective = { rating: 5, 'ratingType': 'stars', read: Date.now() }

function getSbot()
{
  return createSbot({
    temp: 'test-write' + Math.random(),
    keys: ssbKeys.generate()
  })
}

tape('simple create', function (t) {
  var sbot = getSbot()

  db.create(sbot, common, subjective, (err, msg) => {
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

  db.create(sbot, common, subjective, (err, msg) => {
    const newRating = { rating: 4 }
    db.amend(sbot, msg.key, null, newRating, (err, msg) => {
      const newAuthor = { authors: "El gringo" }
      const readInfo = { shelves: "read", rating: 4.5, ratingType: "stars" }
      db.amend(sbot, msg.key, newAuthor, readInfo, (err, msg) => {
        db.getAll(sbot, books => {
          t.deepEqual(books[0].common, Object.assign(common, newAuthor), "book common amended correctly")
          t.deepEqual(books[0].subjective[msg.value.author],
                      Object.assign(Object.assign(subjective, newRating), readInfo),
                      "book subjective updated correctly")
          t.end()
          sbot.close()
        })
      })
    })
  })
})
