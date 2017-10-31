const nest = require('depnest')
const { h, when, computed } = require('mutant')
var htmlEscape = require('html-escape')

exports.needs = nest({
  'book.obs.book': 'first',
  'about.html.image': 'first',
  'about.obs.name': 'first',
  'emoji.sync.url': 'first',
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

  function renderEmoji (emoji, url) {
    if (!url) return ':' + emoji + ':'
    return `
      <img
        src="${htmlEscape(url)}"
        alt=":${htmlEscape(emoji)}:"
        title=":${htmlEscape(emoji)}:"
        class="emoji"
      >
    `
  }

  function simpleMarkdown(text) {
    if (text.startsWith(':'))
      return renderEmoji(text, api.emoji.sync.url(text.match(/:([^:]*)/)[1]))
    else
      return text
  }
  
  function valueEdit(isEditing, value) {
    return when(isEditing,
                h('input', {'ev-input': e => value.set(e.target.value), value: value }),
                h('span', { innerHTML: computed(value, simpleMarkdown) }))

  }

  function simpleEdit(isEditing, name, value) {
    return h('div', { classList: when(computed([value, isEditing], (v, e) => { return v || e }),
                                      '-expanded', '-contracted') },
             [h('span', name + ':'),
              when(isEditing,
                   h('input', {'ev-input': e => value.set(e.target.value), value: value }),
                   h('span', value))])

  }

  function textEdit(isEditing, name, value) {
    const markdown = api.message.html.markdown
    const input = h('textarea', {'ev-input': e => value.set(e.target.value), value: value() })

    return h('div', { classList: when(computed([value, isEditing], (v, e) => { return v || e }),
                                      '-expanded', '-contracted') },
             [h('div', name + ':'),
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
              h('section', [api.about.html.image(user),
                            h('span', [api.about.obs.name(msg.value.author), ' rated ']),
                            valueEdit(isEditing, subjective.rating),
                            valueEdit(isEditing, subjective.ratingType)]),
              simpleEdit(isEditing, 'Shelve', subjective.shelve),
              simpleEdit(isEditing, 'Genre', subjective.genre),
              textEdit(isEditing, 'Review', subjective.review)
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
