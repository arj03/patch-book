var nest = require('depnest')
var htmlEscape = require('html-escape')

exports.needs = nest({
  'emoji.sync.url': 'first'
})

exports.gives = nest('book.html.simpleEmoji')

exports.create = function (api) {
  return nest('book.html.simpleEmoji', simpleMarkdown)

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
}
