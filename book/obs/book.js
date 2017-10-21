const nest = require('depnest')
const ref = require('ssb-ref')
const { Value, Struct } =  require('mutant')

exports.needs = nest({
  'book.pull.get': 'first',
  'book.obs.struct': 'first',
  'blob.sync.url': 'first',
  'sbot.async.publish': 'first'
})

exports.gives = nest('book.obs.book')

exports.create = function (api) {
  return nest('book.obs.book', function (id) {
    if (!ref.isLink(id)) throw new Error('a valid id must be specified')

    let book = api.book.obs.struct({ key: id })
    api.book.pull.get(id, dbBook => {
      // FIXME: subjective
      Object.keys(dbBook.common).forEach((k) => {
        if (dbBook.common[k]) {
          book.common[k].set(dbBook.common[k])
        }
      })
    })

    // FIXME: usage
    book.create = function(commonObj, subjectiveObj, cb)
    {
      api.sbot.async.publish({ type: 'bookclub',
                               common: commonObj,
                               subjective: subjectiveObj }, cb)
    }

    book.amend = function(cb)
    {
      let msg = { type: 'bookclub-update', root: id }

      if (book.common) {
        msg.common = {}
        Object.keys(book.common).forEach((k) => {
          if (book.common[k]) {
            msg.common[k] = book.common[k]()
          }
        })
      }

      /* FIXME
      if (book.subjective)
        msg.subjective = subjectiveObj
       */

      api.sbot.async.publish(msg, cb)
    }

    return book
  })
}
