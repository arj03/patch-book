const nest = require('depnest')
const { h, when } = require('mutant')

exports.needs = nest({
  'blob.sync.url': 'first'
})

exports.gives = nest(
  'book.html.title'
)

exports.create = (api) => {
  return nest('book.html.title', title)
  function title({title, msg, isEditing, onUpdate}) {
    return h('section.title',
      when(isEditing,
        h('input', {
          'ev-input': e => onUpdate(e.target.value),
          placeholder: 'Title',
          value: title
        }),
        h('a', {href: msg.key}, title)
      )
    )
  }
}
