const nest = require('depnest')
const { h, when } = require('mutant')

exports.needs = nest({
  'blob.sync.url': 'first'
})

exports.gives = nest(
  'book.html.authors'
)

exports.create = (api) => {
  return nest('book.html.authors', authors)
  function authors ({authors, isEditing, onUpdate}) {
    return h('section.authors',
      when(isEditing,
        h('input', {'ev-input': e => onUpdate(e.target.value), value: authors}),
        h('span', authors)
      )
    )
  }
}
