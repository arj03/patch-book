const nest = require('depnest')
const { h, when, computed } = require('mutant')

exports.needs = nest({
  'about.html.link': 'first',
  'blob.sync.url': 'first',
  'book.obs.book': 'first',
  'message.html': {
    'markdown': 'first'
  },
  'book.html': {
    'title': 'first',
    'authors': 'first',
    'description': 'first',
    'images': 'first'
  }
})

exports.gives = nest('book.html.layout')

exports.create = (api) => {
  return nest('book.html.layout', bookLayout)

  function bookLayout (msg, opts) {
    if (!(opts.layout === undefined || opts.layout === 'detail')) return

    const { obs, isEditing, isCard } = opts

    const { title, authors, description, images } = api.book.html

    return h('Message -book-detail', [
      h('.toggle-layout', {
        'ev-click': e => {
          e.preventDefault()
          isCard.set(true)
        }
      }, '-'),
      title({ title: obs.title, msg, isEditing, onUpdate: obs.title.set }),
      h('section.content', [
        images({images: obs.images, isEditing, onUpdate: obs.images.add }),
        h('section.authors', authors({authors: obs.authors, isEditing, onUpdate: obs.authors.set})),
        h('section.description', description({description: obs.description, isEditing, onUpdate: obs.description.set})),
      ]),
      h('section.actions', [
        h('button.edit', { 'ev-click': () => isEditing.set(!isEditing()) }, when(isEditing, 'Cancel', 'Edit')),
        when(isEditing, h('button', {'ev-click': () => save(obs)}, 'Update'))
      ])
    ])

    function save (obs) {
      // FIXME: check if anything changed
      obs.amend()

      isEditing.set(false)
    }
  }
}
