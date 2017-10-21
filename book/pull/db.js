const pull = require('pull-stream')
const nest = require('depnest')

exports.gives = nest({
  'book.pull': ['get', 'getAll', 'create', 'amend']
})

exports.needs = nest({
  'sbot.pull.messagesByType': 'first',
  'sbot.pull.links': 'first',
  'sbot.async.get': 'first',
  'sbot.async.publish': 'first'
})

exports.create = function (api) {

  return nest({
    'book.pull.get': get,
    'book.pull.getAll': getAll,
    'book.pull.create': create,
    'book.pull.amend': amend
  })
  
  function create(commonObj, subjectiveObj, cb)
  {
    api.sbot.async.publish({ type: 'bookclub',
                             common: commonObj,
                             subjective: subjectiveObj }, cb)
  }

  function amend(id, commonObj, subjectiveObj, cb)
  {
    let msg = { type: 'bookclub-update', root: id }
    if (commonObj)
      msg.common = commonObj
    if (subjectiveObj)
      msg.subjective = subjectiveObj
    
    api.sbot.async.publish(msg, cb)
  }

  function get(key, cb) {
    pull(
      api.sbot.async.get(key),
      pull.asyncMap((msg, cb) => hydrate(msg, cb)),
      pull.drain(book => cb(book))
    )
  }
  
  function getAll(cb) {
    pull(
      api.sbot.pull.messagesByType({ type: 'bookclub', fillCache: true, keys: false }),
      pull.asyncMap((msg, cb) => hydrate(msg, cb)),
      pull.collect((books) => {
        cb([books]) // FIXME: array?
      })
    )
  }

  // internal

  function applyAmends(book, cb) {
    pull(
      api.sbot.pull.links({ dest: book.key }), // live: true
      pull.filter(data => data.key),
      pull.asyncMap((data, cb) => {
        api.sbot.async.get(data.key, cb)
      }),
      pull.collect((err, msgs) => { // for live use drain
        if (err) throw err

        msgs.forEach(msg => {
          book.common = Object.assign(book.common, msg.content.common)
          book.subjective[msg.author] = Object.assign(book.subjective[msg.author],
                                                      msg.content.subjective)
        })

        cb(book)
      })
    )
  }
  
  function hydrate(msg, cb)
  {
    var book = {
      key: msg.key,
      common: msg.content.common,
      subjective: {}
    }
    book.subjective[msg.author] = msg.content.subjective

    applyAmends(book, cb)
  }
}
