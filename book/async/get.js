const pull = require('pull-stream')
const sort = require('pull-sort')
const nest = require('depnest')

exports.gives = nest({
  'book.async.get': true
})

exports.needs = nest({
  'sbot.pull.links': 'first',
  'sbot.async.get': 'first',
  'keys.sync.id': 'first'
})

exports.create = function (api) {
  return nest({ 'book.async.get': get })

  // FIXME: this might need to be book.obs.get, but have to wait and see with using about
  function get(key, cb) {
    pull(
      pull.values([key]),
      pull.asyncMap((key, cb) => api.sbot.async.get(key, cb)),
      pull.asyncMap((msg, cb) => hydrate(msg, key, (data) => cb(null, data))),
      pull.drain(cb)
    )
  }

  // internal

  function hydrate(msg, key, cb) {
    var book = {
      key,
      common: msg.content,
      subjective: {
        [api.keys.sync.id()]: {
          rating: '', ratingType: '', review: '', shelve: '', genre: ''
        }
      }
    }

    cb(book)

    applyAmends(book, cb)
  }

  function applyAmends(book, cb) {
    pull(
      api.sbot.pull.links({ dest: book.key }), // FIXME: can't do live together with sorting and links doesn't support timestamp
      pull.filter(data => data.key),
      pull.asyncMap((data, cb) => {
        api.sbot.async.get(data.key, cb)
      }),
      sort((a, b) => a.timestamp - b.timestamp),
      pull.drain(msg => {
        if (msg.content.type !== "about") return

        const { rating, ratingType, shelve, genre, review } = msg.content

        if (rating || ratingType || shelve || genre || review) {
          book.subjective[msg.author] = {
            rating,
            ratingType,
            shelve,
            genre,
            review
          }
        } else
          book.common = Object.assign({}, book.common, msg.content)

        cb(book)
      })
    )
  }
}
