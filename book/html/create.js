const { h } = require('mutant')
const nest = require('depnest')

exports.needs = nest({
  'blob.html.input': 'first',
  'message.html.confirm': 'first'
})

exports.gives = nest('book.html.create')

exports.create = function (api) {
  return nest({ 'book.html.create': create })

  // FIXME: UI to set
  function create() {
    // FIXME: create using db & the observable
  }
  
  function create () {
    const actions = h('button', {'ev-click': () => create()}, 'Create')
    const composer = h('div', [
      actions
    ])
    return composer
  }
}
