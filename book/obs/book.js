const nest = require('depnest')
const ref = require('ssb-ref')
const { Value, Struct, Dict } =  require('mutant')

exports.needs = nest({
  'book.pull.get': 'first',
  'book.obs.struct': 'first',
  'keys.sync.id': 'first',
  'sbot.async.publish': 'first'
})

exports.gives = nest('book.obs.book')

exports.create = function (api) {
  return nest('book.obs.book', function (id) {
    if (!ref.isLink(id)) throw new Error('a valid id must be specified')

    let book = api.book.obs.struct({ key: id })
    api.book.pull.get(id, dbBook => {
      Object.keys(dbBook.common).forEach((k) => {
        if (dbBook.common[k]) {
          book[k].set(dbBook.common[k])
        }
      })

      Object.keys(dbBook.subjective).forEach((k) => {
        var d = {}
        Object.keys(dbBook.subjective[k]).forEach((v) => {
          d[v] = Value(dbBook.subjective[k][v])
        })
        book.subjective.put(k, Struct(d))
      })
    })

    book.amend = function(cb)
    {
      let msg = { type: 'bookclub-update', root: id }

      let s = book()

      msg.common = {
        title: s.title,
        authors: s.authors,
        description: s.description,
        images: s.images
      }

      if (book.subjective)
        msg.subjective = s.subjective[api.keys.sync.id()]

      api.sbot.async.publish(msg, cb)
    }

    return book
  })
}
