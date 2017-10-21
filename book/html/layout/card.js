const nest = require('depnest')
const { h, computed } = require('mutant')
const spacetime = require('spacetime')

exports.needs = nest({
  'message.html': {
    backlinks: 'first',
    meta: 'map',
    action: 'map',
    timestamp: 'first'
  },
  'about.html.image': 'first',
  'about.obs.color': 'first',
  'blob.sync.url': 'first',
  'book.obs.book': 'first',
  'book.html': {
    description: 'first',
    title: 'first'
  }
})

exports.gives = nest('book.html.layout')

exports.create = (api) => {
  return nest('book.html.layout', bookLayout)

  function bookLayout (msg, opts) {
    const { layout, obs, isCard } = opts

    if (!(layout === undefined || layout === 'card')) return

    const { timestamp, meta, backlinks, action } = api.message.html

    const { description, title, authors } = api.book.html
    
    const content = [
      h('a', { href: msg.key }, [
        h('.toggle-layout', {
          'ev-click': e => {
            e.preventDefault()
            isCard.set(false)
          }
        }, '+'),
        h('.details', [
          title({title: obs.title, msg}),
          authors({authors: obs.authors}),
          description({description: obs.description})
        ])
      ])
    ]

    return h('Message -book-card', [
      h('section.avatar', {}, api.about.html.image(msg.value.author)),
      h('section.timestamp', {}, timestamp(msg)),
      h('section.meta', {}, meta(msg)),
      h('section.content', {}, content),
      h('section.actions', {}, action(msg)),
      h('footer.backlinks', {}, backlinks(msg))
    ])
  }
}
