const h = require('mutant/h')
const Value = require('mutant/value')
const when = require('mutant/when')
const nest = require('depnest')

exports.needs = nest({
  'blob.sync.url': 'first',
  'book.obs.book': 'first',
  'book.html': {
    'layout': 'first'
  },
  'feed.html.render': 'first',
  'keys.sync.load': 'first',
  'about.html.link': 'first',
  'message.html': {
    decorate: 'reduce',
    link: 'first',
    markdown: 'first'
  }
})

exports.gives = nest({
  'message.html': ['render'],
  'book.html': ['render']
})

exports.create = function (api) {
  return nest({
    'message.html.render': renderBook,
    'book.html.render': renderBook
  })

  function renderBook (msg, { pageId } = {}) {
    if (!msg.value || (msg.value.content.type !== 'bookclub')) return

    const isEditing = Value(false)
    const isCard = Value(true)

    if (pageId === msg.key) isCard.set(false)

    const obs = api.book.obs.book(msg.key)

    const element = h('div', {attributes: {tabindex: '0'}},
      when(isCard,
        api.book.html.layout(msg, {layout: 'card', isEditing, isCard, obs}),
        api.book.html.layout(msg, {layout: 'detail', isEditing, isCard, obs})
    ))

    return api.message.html.decorate(element, { msg })
  }
}
