const pull = require('pull-stream')
const many = require('pull-many')
const sort = require('pull-sort')
const timestamp = require('monotonic-timestamp')
const nest = require('depnest')

exports.gives = nest({
  'book.pull.getAll': true
})

exports.needs = nest({
  'sbot.pull.messagesByType': 'first'
})

exports.create = function (api) {
  return nest({ 'book.pull.getAll': getAll })

  function getLive() {
    return api.sbot.pull.messagesByType({ type: 'bookclub', fillCache: true,
                                          keys: true, reverse: false,
                                          live: true, gt: timestamp() })
  }

  function getCurrent() {
    return api.sbot.pull.messagesByType({ type: 'bookclub', fillCache: true,
                                          keys: true, reverse: false })
  }

  function getAll() {
    return pull(
      many([
        pull(
          getCurrent(),
          sort((a, b) => a.value.timestamp - b.value.timestamp)
        ),
        getLive()
      ])
    )
  }
}
