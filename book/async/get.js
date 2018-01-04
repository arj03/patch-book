const pull = require('pull-stream')
const sort = require('pull-sort')
const nest = require('depnest')

exports.gives = nest({
  'book.async.get': true
})

exports.needs = nest({
  'sbot.pull.links': 'first',
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

    applyAmends(book, updatedBook =>
                getCommentsOnSubjective(updatedBook, cb))
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
                api.sbot.pull.links({ dest: key, live: key == subj.key }),
                pull.filter(data => data.key),
                pull.asyncMap((data, cb) => {
                  api.sbot.async.get(data.key, (err, msg) => {
                    msg.key = data.key
                    cb(err, msg)
                  })
                }),
                //sort((a, b) => a.timestamp - b.timestamp),
                pull.drain(msg => {
                  if (msg.content.type !== "post") return

                  // FIXME: links is buggy and returns the same message twice
                  if (!subj.comments.some(c => c.content.text == msg.content.text)) {
                    subj.comments.push(msg)
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
      api.sbot.pull.links({ dest: book.key }), // FIXME: can't do live
                                               // together with
                                               // sorting and links
                                               // doesn't support timestamp
      pull.filter(data => data.key),
      pull.asyncMap((data, cb) => {
        api.sbot.async.get(data.key, (err, msg) => {
          msg.key = data.key
          cb(err, msg)
        })
      }),
      sort((a, b) => a.timestamp - b.timestamp),
      pull.drain(msg => {
        if (msg.content.type !== "about") return

        const { rating, ratingMax, ratingType, shelve, genre, review } = msg.content

        if (!allAuthorKeys[msg.author])
          allAuthorKeys[msg.author] = []

        let allKeys = allAuthorKeys[msg.author]
        allKeys.push(msg.key)

        if (rating || ratingMax || ratingType || shelve || genre || review) {
          book.subjective[msg.author] = {
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
          book.common = Object.assign({}, book.common, msg.content)

        cb(book)
      })
    )
  }
}
