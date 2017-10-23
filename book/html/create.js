const { h, when, Value } = require('mutant')
const nest = require('depnest')

exports.needs = nest({
  'blob.html.input': 'first',
  'message.html.confirm': 'first',
  'book.obs.struct': 'first',
  'book.html': {
    'images': 'first'
  }
})

exports.gives = nest('book.html.create')

exports.create = function (api) {
  var showCreate = Value(false)

  return nest({ 'book.html.create': create })

  function createBook() {
    let book = api.book.obs.struct()

    const { images } = api.book.html

    return h('Create -book',
             { classList: when(showCreate, '-expanded', '-contracted') }, [
      h('section.content', [
        h('div.title', [h('label', 'Title'),
                        h('input', {'ev-input': e => book.title.set(e.target.value),
                                    value: '' })]),
        images({images: book.images, isEditing: true, onUpdate: book.images.add }),
        h('div.authors', [h('label', 'Authors'),
                          h('input', {'ev-input': e => book.authors.set(e.target.value),
                                      value: '' })]),
        h('div.description', [h('label', 'Description'),
                              h('textarea', {'ev-input': e => book.description.set(e.target.value),
                                             value: '' }) ])
      ]),
      h('section.actions', [
        h('button', {'ev-click': () => showCreate.set(false) }, 'Cancel'),
        h('button', {'ev-click': () => save(book)}, 'Create book')
      ])
    ])

    function save (book) {
      book.create()

      showCreate.set(false)
    }
  }
  
  function create () {
    const actions = h('button', {'ev-click': () => showCreate.set(true) }, 'Create')
    const composer = h('div', [
      actions,
      createBook()
    ])
    return composer
  }
}
