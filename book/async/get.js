const pull = require('pull-stream')
const nest = require('depnest')

exports.gives = nest({
  'book.async.get': true,
})

exports.needs = nest({
  'sbot.pull.links': 'first',
  'sbot.async.get': 'first',
  'keys.sync.id': 'first'
})

exports.create = function (api) {
  return nest({ 'book.async.get': get })

  // REVIEW - if I've read this right, while it uses pull-streams, this does not return a pull-stream
  // it's actually an async function, which is why I've moved this here
  //
  // oh but it returns an obs ... so maybe it should be book.obs.get?
  // I think all of this should be rolled into one obs...
  //
  function get(key, cb) {
    pull(
      pull.values([key]),
      pull.asyncMap((key, cb) => api.sbot.async.get(key, cb)),
      // pull.asyncMap((msg) => hydrate(msg, key, cb)), // <<< this seems to break the pattern - REVIEW
      pull.asyncMap((msg, cb) => hydrate(msg, key, cb)), // <<<  should it be this? - REVIEW
      pull.drain(cb)
    )
  }

  // internal

  function hydrate(msg, key, cb) {
    var book = {
      key,
      common: msg.content,
      subjective: {
        [api.keys.sync.id()]: { // REVIEW - I think this works in current node
          rating: '', ratingType: '', review: '', shelve: '', genre: ''
        }
      }
    }

    applyAmends(book, cb)
  }

  // REVIEW - this looks like it works quite well - cool to see asyncMap, that's new to me!
  // I think this might be able to leverage the about indexes using patchcore's
  // 'about.obs.groupedValues'
  //
  // this confused me that it's live, I feel like we're mixing a get of the current state with
  // with a the dynamic updating of an obs ... ?
 
  function applyAmends(book, cb) {
    pull(
      api.sbot.pull.links({ dest: book.key, live: true }),
      pull.filter(data => data.key),
      pull.asyncMap((data, cb) => {
        api.sbot.async.get(data.key, cb)
      }),
      pull.drain(msg => {
        if (msg.content.type !== "about") return

        const { rating, ratingType, shelve, genre, review } = msg.content

        if (rating || ratingType || shelve || genre || review) {
          book.subjective[msg.author] = {
            rating,
            ratingType,
            shelve,
            genre,
            review
          }
        } else
          book.common = Object.assign({}, book.common, msg.content)
          //                           ^ sometimes mutating the original bites you - REVIEW

        cb(book)
      })
    )
  }

}

