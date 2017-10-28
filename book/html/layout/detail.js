const nest = require('depnest')
const { h, when, computed } = require('mutant')

exports.needs = nest({
  'book.obs.book': 'first',
  'about.html.image': 'first',
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

  function simpleEdit(isEditing, name, value) {
    return h('div', [h('span', name),
                     when(isEditing,
                          h('input', {'ev-input': e => value.set(e.target.value), value: value() }),
                          h('span', value))])

  }

  function textEdit(isEditing, name, value) {
    const markdown = api.message.html.markdown
    const input = h('textarea', {'ev-input': e => value.set(e.target.value), value: value() })

    return h('div', [h('span', name),
                     when(isEditing, input, computed(value, markdown))])
  }

  function bookLayout (msg, opts) {
    if (!(opts.layout === undefined || opts.layout === 'detail')) return

    const { obs, isEditing, isCard } = opts

    const { title, authors, description, images } = api.book.html

    let reviews = []

    return h('Message -book-detail', [
      title({ title: obs.title, msg, isEditing, onUpdate: obs.title.set }),
      authors({authors: obs.authors, isEditing, onUpdate: obs.authors.set}),
      h('section.content', [
        images({images: obs.images, isEditing, onUpdate: obs.images.add }),
        h('section.description',
          description({description: obs.description, isEditing, onUpdate: obs.description.set})),
      ]),
      h('section.subjective', [
        computed(obs.subjective, subjectives => {
          let i = 0;
          Object.keys(subjectives).forEach(user => {
            if (i++ < reviews.length) return
            let subjective = obs.subjective.get(user)
            reviews.push([
              h('section.avatar', {}, api.about.html.image(user)),
              h('section', [
                textEdit(isEditing, 'Review', subjective.review),
                simpleEdit(isEditing, 'Rating', subjective.rating),
                simpleEdit(isEditing, 'Rating type', subjective.ratingType),
                simpleEdit(isEditing, 'Shelve', subjective.shelve),
                simpleEdit(isEditing, 'Genre', subjective.genre)
              ])
            ])
          })

          return reviews
        })
      ]),
      h('section.actions', [
        h('button.edit', { 'ev-click': () => isEditing.set(!isEditing()) },
          when(isEditing, 'Cancel', 'Edit')),
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
