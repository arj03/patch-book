const nest = require('depnest')
const { h, computed, when } = require('mutant')

exports.needs = nest({
  'message.html.markdown': 'first'
})

exports.gives = nest('book.html.shortDescription')

exports.create = (api) => {
  return nest('book.html.shortDescription', description)
  function description (description) {
    const markdown = api.message.html.markdown

    return h('Description', [
      computed(description, (d) => d ? markdown(d.length > 250 ? d.substring(0, 250) + '...' : d) : '')
    ])
  }
}
