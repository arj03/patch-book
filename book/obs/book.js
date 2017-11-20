const nest = require('depnest')
const ref = require('ssb-ref')
const { Value, Struct, Dict } =  require('mutant')
const deepEq = require('deep-equal')

exports.needs = nest({
  'book.async.get': 'first',
  'book.obs.struct': 'first',
  'keys.sync.id': 'first',
  'sbot.async.publish': 'first'
})

exports.gives = nest('book.obs.book')

exports.create = function (api) {
  return nest('book.obs.book', function (id) {
    if (!ref.isLink(id)) throw new Error('a valid id must be specified')

    let book = api.book.obs.struct({ key: id })

    api.book.async.get(id, dbBook => {
      book.title.set(dbBook.common.title)
      book.authors.set(dbBook.common.authors)
      book.description.set(dbBook.common.description)
      book.series.set(dbBook.common.series)

      const { image } = dbBook.common

      // workaround for https://github.com/mmckegg/mutant/issues/20
      if (image && !book.images().some(i => deepEq(i, image)))
        book.images.add(dbBook.common.image)

      Object.keys(dbBook.subjective).forEach((user) => {
        if (book.subjective.has(user))
        {
          Object.keys(dbBook.subjective[user]).forEach((v) => {
            book.subjective.get(user)[v].set(dbBook.subjective[user][v])
          })
        }
        else
        {
          let values = {}
          Object.keys(dbBook.subjective[user]).forEach((v) => {
            values[v] = Value(dbBook.subjective[user][v])
          })
          book.subjective.put(user, Struct(values))
        }
      })
    })

    book.amend = function(cb)
    {
      let msg = { type: 'about', about: id }

      let b = book()

      msg.title = b.title
      msg.authors = b.authors
      msg.description = b.description
      msg.series = b.series

      if (b.images.length > 0)
        msg.image = b.images[0]

      api.sbot.async.publish(msg, cb)
    }

    book.updateSubjective = function(cb)
    {
      let b = book()

      let msg = { type: 'about', about: id }
      msg = Object.assign(msg, b.subjective[api.keys.sync.id()])

      api.sbot.async.publish(msg, cb)
    }

    return book
  })
}
