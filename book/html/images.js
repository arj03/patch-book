const nest = require('depnest')
const { h, Set, map, forEach, when } = require('mutant')

exports.needs = nest({
  'blob.sync.url': 'first',
  'blob.html.input': 'first'
})

exports.gives = nest('book.html.images')

exports.create = (api) => {
  return nest('book.html.images', images)
  function images ({images, isEditing, onUpdate}) {
    const fileInput = api.blob.html.input(file => {
      onUpdate(file)
    })

    return h('section.images', {}, [
      map(images, image => h('img', {src: api.blob.sync.url(image.link)})),
      when(isEditing, [h('div', 'Add an image:'), fileInput])
    ])
  }
}
