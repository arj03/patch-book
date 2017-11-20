const nest = require('depnest')
const { h, when } = require('mutant')

exports.needs = nest({
  'blob.sync.url': 'first',
  'app.sync.goTo': 'first'
})

exports.gives = nest(
  'book.html.series'
)

exports.create = (api) => {
  return nest('book.html.series', series)
  function series({series, msg, isEditing, onUpdate}) {
    return h('section.series',
      when(isEditing,
        h('input', {
          'ev-input': e => onUpdate(e.target.value),
          placeholder: 'Series',
          value: series
        }),
        h('a', { 'href': '#',
                 'ev-click': () => api.app.sync.goTo({
                   page: 'books',
                   query: 'series=' + series()
                 })
               }, series)
      )
    )
  }
}
