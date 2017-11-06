const pull = require('pull-stream')
const nest = require('depnest')

exports.gives = nest({
  'book.pull.getAll': true
  // this style is easier to search for IMO
})

exports.needs = nest({
  'sbot.pull.messagesByType': 'first'
})

exports.create = function (api) {
  return nest({ 'book.pull.getAll': getAll })
  
  function getAll() {
    // we can trust this returns a pull stream alread because it's sbot.pull.*
    return api.sbot.pull.messagesByType({ type: 'bookclub', fillCache: true,
                                          keys: true, reverse: true, live: true })
  }
}
