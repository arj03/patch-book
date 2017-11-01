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
      book.title.set(dbBook.common.title)
      book.authors.set(dbBook.common.authors)
      book.description.set(dbBook.common.description)

      if (dbBook.common.image)
        book.images.add(dbBook.common.image)

      Object.keys(dbBook.subjective).forEach((k) => {
        if (book.subjective.has(k))
        {
          Object.keys(dbBook.subjective[k]).forEach((v) => {
            book.subjective.get(k)[v].set(dbBook.subjective[k][v])
          })
        }
        else
        {
          let d = {}
          Object.keys(dbBook.subjective[k]).forEach((v) => {
            d[v] = Value(dbBook.subjective[k][v])
          })
          book.subjective.put(k, Struct(d))
        }
      })
    })

    book.amend = function(cb)
    {
      let msg = { type: 'about', root: id }

      let s = book()

      msg.title = s.title
      msg.authors = s.authors
      msg.description = s.description

      if (s.images.length > 0)
        msg.image = s.images[0]

      api.sbot.async.publish(msg, cb)
    }

    book.updateSubjective = function(cb)
    {
      let s = book()

      let msg = { type: 'bookclub-subjective', root: id }
      msg = Object.assign(msg, s.subjective[api.keys.sync.id()])

      api.sbot.async.publish(msg, cb)
    }

    return book
  })
}
