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
    if (opts.common) {
      Object.keys(opts.common).forEach((k) => {
        if (opts.common[k]) {
          struct.common[k].set(opts.common[k])
        }
      })
    }

    struct.create = function(cb)
    {
      let commonObj = {}
      Object.keys(struct.common).forEach((k) => {
        if (struct.common[k]) {
          commonObj[k] = struct.common[k]()
        }
      })

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
