const { h, Value, computed } = require('mutant')
var nest = require('depnest')
var extend = require('xtend')

exports.needs = nest({
  'about.obs.latestValue': 'first',
  'sbot.async.get': 'first',
  'book.html.simpleEmoji': 'first',
  'message.html': {
    decorate: 'reduce',
    layout: 'first',
    markdown: 'first'
  }
})

exports.gives = nest('message.html.render')

exports.create = function (api) {
  return nest('message.html.render', subjective)

  function subjective(msg, opts) {
    if (!msg.value || !msg.value.content)
      return

    const content = msg.value.content
    
    if (content.type == 'about' && content.rating && content.ratingType)
    {
      const element = api.message.html.layout(msg, extend({
        content: renderSubjective(msg),
        layout: content.review ? 'default' : 'mini'
      }, opts))

      return api.message.html.decorate(element, { msg })
    }
  }

  function bookTitle(msg) {
    const name = Value('')
    const bookKey = msg.value.content.about
    api.sbot.async.get(bookKey, (err, msg) => {
      let originalTitle = msg.content.title
      let latestTitle = api.about.obs.latestValue(bookKey, 'title')()
      name.set(latestTitle || originalTitle)
    })
    return name
  }
  
  function renderSubjective(msg) {
    let title = bookTitle(msg)
    const content = msg.value.content
    return ['Rated ', h('a', { href: msg.value.content.about }, title),
            ' ' + content.rating + ' ',
            content.ratingMax ? ' / ' + content.ratingMax : '',
            h('span.text', { innerHTML:
                             computed(content.ratingType,
                                      api.book.html.simpleEmoji) }),
            computed(content.review, api.message.html.markdown)
           ]
  }
}
