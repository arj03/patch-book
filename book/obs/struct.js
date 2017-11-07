const nest = require('depnest')
const { Value, Set, Dict, Struct } = require('mutant')

exports.needs = nest({
  'sbot.async.publish': 'first'
})

exports.gives = nest('book.obs.struct')

exports.create = function (api) {
  return nest('book.obs.struct', function (opts = {}) {
    const struct = Struct({
      key: Value(''),
      title: Value(''),
      authors: Value(''),
      description: Value(''),
      images: Set([]),
      subjective: Dict()
    })

    // REVIEW - this is an interesting idea a book which can publish itself.
    // It feels Object Oriented, and I think functional is more the style of node,
    // so perhaps this should just be a function where this publish is happening in book/html/create
    // so that people can't accidentally push this button in the wrong context?
    struct.create = function(cb)
    {
      let s = struct()

      let message = {
        type: 'bookclub', // REVIEW - this app is patch-book, seems like it should be patch-bookclub or rename this to type book?
        title: s.title,
        authors: s.authors,
        description: s.description
      }

      if (s.images.length > 0)
        message.image = s.images[0]

      api.sbot.async.publish(message, cb)
    }

    return struct
  })
}
