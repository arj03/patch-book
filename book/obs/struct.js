const nest = require('depnest')
const { Value, Set, Struct, forEachPair } = require('mutant')

exports.gives = nest('book.obs.struct')

exports.create = function (api) {
  return nest('book.obs.struct', function (opts = {}) {
    const struct = Struct({
      key: Value(''),
      title: Value(''),
      authors: Value(''),
      description: Value(''),
      images: Set([]),
      subjective: Set([])
    })

    struct.create = function(cb)
    {
      let s = struct()

      let commonObj = {
        title: s.title,
        authors: s.authors,
        description: s.description
      }
      let subjectiveObj = null // FIXME

      console.log(commonObj)
      return

      api.sbot.async.publish({ type: 'bookclub',
                               common: commonObj,
                               subjective: subjectiveObj }, cb)
    }

    return struct
  })
}
