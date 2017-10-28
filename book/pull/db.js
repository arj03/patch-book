const pull = require('pull-stream')
const nest = require('depnest')

exports.gives = nest({
  'book.pull': ['get', 'getAll']
})

exports.needs = nest({
  'sbot.pull.messagesByType': 'first',
  'sbot.pull.links': 'first',
  'sbot.async.get': 'first'
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
      api.sbot.pull.messagesByType({ type: 'bookclub', fillCache: true, keys: true })
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
        if (msg.content.type !== "bookclub-update") return

        book.common = Object.assign(book.common, msg.content.common)
        book.subjective[msg.author] = Object.assign(book.subjective[msg.author] || {},
                                                    msg.content.subjective)

        cb(book)
      })
    )
  }
  
  function hydrate(msg, key, cb)
  {
    var book = {
      key: key,
      common: msg.content.common,
      subjective: {}
    }
    book.subjective[msg.author] = msg.content.subjective ||
      { rating: '', ratingType: '', review: '', shelve: '', genre: '' }

    applyAmends(book, cb)
  }
}
