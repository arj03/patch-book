const nest = require('depnest')
const ref = require('ssb-ref')
const { Value, Struct } =  require('mutant')

exports.needs = nest({
  'book.pull.get': 'first',
  'blob.sync.url': 'first'
})

exports.gives = nest('book.obs.book')

exports.create = function (api) {
  return nest('book.obs.book', function (id) {
    if (!ref.isLink(id)) throw new Error('a valid id must be specified')

    let book = api.book.pull.get(id)
    const s = Struct()

    Object.keys(book).forEach(k => {
      if (book[k])
        s[k].set(book[k])
    })

    return s
  })
}
