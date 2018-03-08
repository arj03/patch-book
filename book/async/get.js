const pull = require('pull-stream')
const nest = require('depnest')

exports.gives = nest({
  'book.async.get': true
})

exports.needs = nest({
  'sbot.pull.backlinks': 'first',
  'sbot.async.get': 'first',
  'keys.sync.id': 'first'
})

exports.create = function (api) {
  return nest({ 'book.async.get': get })

  // FIXME: this might need to be book.obs.get, but have to wait and see with using about
  function get(key, cb) {
    pull(
      pull.values([key]),
      pull.asyncMap((key, cb) => api.sbot.async.get(key, cb)),
      pull.asyncMap((msg, cb) => hydrate(msg, key, (data) => cb(null, data))),
      pull.drain(cb)
    )
  }

  // internal

  function hydrate(msg, key, cb) {
    var book = {
      key,
      common: msg.content,
      subjective: {
        [api.keys.sync.id()]: {
          key: '', allKeys: [], rating: '', ratingMax: '', ratingType: '',
          review: '', shelve: '', genre: '', comments: []
        }
      }
    }

    cb(book)

    applyAmends(book, updatedBook => getCommentsOnSubjective(updatedBook, cb))
  }

  function getCommentsOnSubjective(book, cb)
  {
    pull(
      pull.values(Object.values(book.subjective)),
      pull.drain(subj => {
        if (subj.key) {
          pull(
            pull.values(Object.values(subj.allKeys)),
            pull.drain(key => {
              pull(
                api.sbot.pull.backlinks({
                  query: [ {$filter: { dest: key }} ],
                  index: 'DTA', // use asserted timestamps
                  live: true
                }),
                pull.drain(msg => {
                  if (msg.sync || msg.value.content.type !== "post") return

                  if (!subj.comments.some(c => c.key == msg.key)) {
                    subj.comments.push(msg.value)
                    cb(book)
                  }
                })
              )
            })
          )
        }
      }, () => cb(book))
    )
  }

  function applyAmends(book, cb) {
    let allAuthorKeys = {}

    pull(
      api.sbot.pull.backlinks({
        query: [ {$filter: { dest: book.key }} ],
        index: 'DTA', // use asserted timestamps
        live: true
      }),
      pull.drain(msg => {
        if (msg.sync || msg.value.content.type !== "about") return

        const { rating, ratingMax, ratingType, shelve, genre, review } = msg.value.content

        if (!allAuthorKeys[msg.value.author])
          allAuthorKeys[msg.value.author] = []

        let allKeys = allAuthorKeys[msg.value.author]
        allKeys.push(msg.key)

        if (rating || ratingMax || ratingType || shelve || genre || review) {
          book.subjective[msg.value.author] = {
            key: msg.key,
            allKeys,
            rating,
            ratingMax,
            ratingType,
            shelve,
            genre,
            review,
            comments: []
          }
        } else
          book.common = Object.assign({}, book.common, msg.value.content)

        cb(book)
      })
    )
  }
}
