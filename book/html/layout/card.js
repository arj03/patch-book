const nest = require('depnest')
const { h, Value } = require('mutant')

exports.needs = nest({
  'message.html': {
    backlinks: 'first',
    meta: 'map',
    action: 'map',
    timestamp: 'first'
  },
  'about.html.image': 'first',
  'book.obs.book': 'first',
  'book.html': {
    description: 'first',
    title: 'first',
    series: 'first',
    authors: 'first',
    images: 'first'
  }
})

exports.gives = nest('book.html.layout')

exports.create = (api) => {
  return nest('book.html.layout', bookLayout)

  function bookLayout (msg, opts) {
    const { layout, obs, isCard } = opts

    if (layout !== undefined && layout !== 'card') return

    const { timestamp, meta, backlinks, action } = api.message.html

    const { description, title, series, authors, images } = api.book.html

    const content = [
      h('a', { href: msg.key }, [
        h('.toggle-layout', {
          'ev-click': e => {
            e.preventDefault()
            isCard.set(false)
          }
        }, '+'),
        h('.details', [
          images({images: obs.images}),
          h('div', [
            title({title: obs.title, msg}),
            series({series: obs.series, seriesNo: obs.seriesNo}),
            authors({authors: obs.authors}),
            description({description: obs.description})
          ])
        ])
      ])
    ]

    let rawMessage = Value(null)

    return h('Message -book-card', [
      h('section.avatar', {}, api.about.html.image(msg.value.author)),
      h('section.timestamp', {}, timestamp(msg)),
      h('section.meta', {}, meta(msg, { rawMessage })),
      h('section.content', {}, content),
      h('section.raw-content', rawMessage),
      h('section.actions', {}, action(msg)),
      h('footer.backlinks', {}, backlinks(msg))
    ])
  }
}
