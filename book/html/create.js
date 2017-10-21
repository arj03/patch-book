const { h } = require('mutant')
const nest = require('depnest')

exports.needs = nest({
  'blob.html.input': 'first',
  'message.html.confirm': 'first',
  'book.obs.struct': 'first',
  'book.html': {
    'title': 'first',
    'authors': 'first',
    'description': 'first'
  }
})

exports.gives = nest('book.html.create')

exports.create = function (api) {
  return nest({ 'book.html.create': create })

  function createBook() {
    const { title, authors, description } = api.book.html
    let book = api.book.obs.struct()

    return h('Message -book-detail', [
      title({ title: '', msg: { key: '' }, isEditing: true, onUpdate: book().common.title.set }),
      h('section.content', [
        //images({images: obs.images, msg, isEditing, onUpdate: book.images.add}),
        h('section.authors', authors({authors: '', isEditing: true,
                                      onUpdate: book().common.authors.set})),
        h('section.description', description({description: '',
                                              isEditing: true,
                                              onUpdate: book().common.description.set})),
        //h('section.time', startDateTime({startDateTime: obs.startDateTime, msg, isEditing, onUpdate: editedGathering.startDateTime.set})),
      ]),
      h('section.actions', [
        h('button.edit', { 'ev-click': () => {
          // FIXME: close?
        }}, 'Cancel'),
        h('button', {'ev-click': () => save(book)}, 'Create book')
      ])
    ])

    function save (book) {
      book.create()

      // FIXME: close/update?
    }
  }
  
  function create () {
    const actions = h('button', {'ev-click': () => createBook()}, 'Create')
    const composer = h('div', [
      actions
    ])
    return composer
  }
}
