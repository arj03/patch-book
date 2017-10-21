const nest = require('depnest')
const { Value, Set, Struct, forEachPair } = require('mutant')

exports.gives = nest('book.obs.struct')

exports.create = function (api) {
  return nest('book.obs.struct', function (opts = {}) {
    const struct = Struct({
      key: Value(''),
      common: {
        title: Value(''),
        authors: Value(''),
        description: Value(''),
        images: Set([])
      },
      subjective: Set([])
    })

    // FIXME: subjective
    Object.keys(opts.common).forEach((k) => {
      if (opts.common[k]) {
        struct.common[k].set(opts.common[k])
      }
    })

    return struct
  })
}
