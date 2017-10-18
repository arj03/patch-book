var pull = require('pull-stream')
var through = require('pull-through')
var multicb = require('multicb')

module.exports = {

  sbot: null,
  myId: "",

  bookDB: function(sbot, cb)
  {
    if (!sbot) throw "Missing sbot"

    var self = Object.create(this)

    self.sbot = sbot
    self.myId = sbot.id

    return self
  },

  create: function(commonObj, subjectiveObj, cb)
  {
    this.sbot.publish({ type: 'bookclub',
                        common: commonObj,
                        subjective: subjectiveObj }, cb)
  },

  amend: function(id, commonObj, subjectiveObj, cb)
  {
    var msg = { type: 'bookclub-update', root: id }
    if (commonObj)
      msg.common = commonObj
    if (subjectiveObj)
      msg.subjective = subjectiveObj
    
    this.sbot.publish(msg, cb)
  },

  getAll: function(cb) {
    var books = []
    
    pull(
      this.getStreamByType('bookclub'),
      pull.asyncMap((msg, cb) => {
        var book = {
          key: msg.key,
          common: msg.content.common,
          subjective: {}
        }
        book.subjective[msg.author] = msg.content.subjective
        books.push(book)

        this.applyAmends(book, cb)
      }),
      pull.collect((err, msgs) => {
        cb(books)
      })
    )
  },

  // internal
  
  applyAmends: function(book, cb) {
    var sbot = this.sbot
    pull(
      sbot.links({ dest: book.key }), // live: true
      pull.filter(data => data.key),
      pull.asyncMap((data, cb) => {
        sbot.get(data.key, cb)
      }),
      pull.collect((err, msgs) => { // for live use drain
        if (err) throw err

        msgs.forEach(msg => {
          book.common = Object.assign(book.common, msg.content.common)
          book.subjective[msg.author] = Object.assign(book.subjective[msg.author], msg.content.subjective)
        })

        cb(book)
      })
    )
  },
  
  getStreamByType: function(type)
  {
    return this.sbot.messagesByType({ type: type, fillCache: true, keys: false })
  }
}
