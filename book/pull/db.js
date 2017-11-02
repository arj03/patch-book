const pull = require('pull-stream')
const nest = require('depnest')

exports.gives = nest({
  'book.pull': ['get', 'getAll']
})

exports.needs = nest({
  'sbot.pull.messagesByType': 'first',
  'sbot.pull.links': 'first',
  'sbot.async.get': 'first',
  'keys.sync.id': 'first'
})

exports.create = function (api) {

  return nest({
    'book.pull.get': get,
    'book.pull.getAll': getAll
  })
  
  function get(key, cb) {
    pull(
      pull.values([key]),
      pull.asyncMap((key, cb) => api.sbot.async.get(key, cb)),
      pull.asyncMap((msg) => hydrate(msg, key, cb)),
      pull.drain(cb)
    )
  }
  
  function getAll() {
    return pull(
      api.sbot.pull.messagesByType({ type: 'bookclub', fillCache: true,
                                     keys: true, reverse: true })
    )
  }

  // internal

  function applyAmends(book, cb) {
    pull(
      api.sbot.pull.links({ dest: book.key, live: true }),
      pull.filter(data => data.key),
      pull.asyncMap((data, cb) => {
        api.sbot.async.get(data.key, cb)
      }),
      pull.drain(msg => {
        if (msg.content.type == "about") {
          // FIXME: refactor this
          if (msg.content.rating || msg.content.ratingType || msg.content.shelve ||
              msg.content.genre || msg.content.review) {
            book.subjective[msg.author] = {
              rating: msg.content.rating,
              ratingType: msg.content.ratingType,
              shelve: msg.content.shelve,
              genre: msg.content.genre,
              review: msg.content.review
            }
          } else
            book.common = Object.assign(book.common, msg.content)
        } else if (msg.content.type == "bookclub-subjective") { // backwards compatability
          book.subjective[msg.author] = {
            rating: msg.content.rating,
            ratingType: msg.content.ratingType,
            shelve: msg.content.shelve,
            genre: msg.content.genre,
            review: msg.content.review
          }
        }
        cb(book)
      })
    )
  }

  function hydrate(msg, key, cb)
  {
    var book = {
      key: key,
      common: msg.content,
      subjective: {}
    }
    book.subjective[api.keys.sync.id()] = { rating: '', ratingType: '', review: '', shelve: '', genre: '' }

    cb(book)

    applyAmends(book, cb)
  }
}
