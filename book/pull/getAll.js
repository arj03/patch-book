const pull = require('pull-stream')
const nest = require('depnest')

exports.gives = nest({
  'book.pull.getAll': true
})

exports.needs = nest({
  'sbot.pull.messagesByType': 'first'
})

exports.create = function (api) {
  return nest({ 'book.pull.getAll': getAll })
  
  function getAll() {
    return api.sbot.pull.messagesByType({ type: 'bookclub', fillCache: true,
                                          keys: true, reverse: false,
                                          live: true })
  }
}
