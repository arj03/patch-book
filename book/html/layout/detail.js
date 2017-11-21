const nest = require('depnest')
const { h, when, computed, Value } = require('mutant')
var htmlEscape = require('html-escape')
const addSuggest = require('suggest-box')

exports.needs = nest({
  'book.obs.book': 'first',
  'about.html.image': 'first',
  'about.obs.name': 'first',
  'keys.sync.id': 'first',
  'emoji.async.suggest': 'first',
  'emoji.sync.url': 'first',
  'message.html': {
    'markdown': 'first'
  },
  'book.html': {
    'title': 'first',
    'authors': 'first',
    'series': 'first',
    'description': 'first',
    'images': 'first'
  }
})

exports.gives = nest('book.html.layout')

exports.create = (api) => {
  return nest('book.html.layout', bookLayout)

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
  
  function ratingEdit(isEditing, value) {
    return when(isEditing,
      h('input', {
        'ev-input': e => value.set(e.target.value),
        value,
        placeholder: 'your rating'
      }),
      h('span.text', { innerHTML: computed(value, simpleMarkdown) })
    )
  }

  function ratingTypeEdit(isEditing, value) {
    let getEmojiSuggestions = api.emoji.async.suggest()

    let ratingTypeInput = h('input', {'ev-input': e => value.set(e.target.value),
                                      value: value, placeholder: 'rating type' })

    let suggestWrapper = h('span.ratingType', ratingTypeInput)

    addSuggest(ratingTypeInput, (inputText, cb) => {
      if (inputText[0] === ':') {
        cb(null, getEmojiSuggestions(inputText.slice(1)))
      }
    }, {cls: 'PatchSuggest'})

    ratingTypeInput.addEventListener('suggestselect', ev => {
      value.set(ev.detail.value)
    })

    return when(isEditing, suggestWrapper,
                h('span.text', { innerHTML: computed(value, simpleMarkdown) }))
  }

  function simpleEdit(isEditing, name, value) {
    const classList = computed([value, isEditing], (v, e) => { 
      return v || e 
        ? '-expanded'
        : '-contracted'
    })

    return h('div', { classList }, [
      h('span', name + ':'),
      when(isEditing,
        h('input', {'ev-input': e => value.set(e.target.value), value }),
        h('span', value)
      )
    ])
  }

  function textEdit(isEditing, name, value) {
    const classList = computed([value, isEditing], (v, e) => { 
      return v || e 
        ? '-expanded'
        : '-contracted'
    })

    return h('div', { classList }, [
      h('div', name + ':'),
      when(isEditing, 
        h('textarea', {'ev-input': e => value.set(e.target.value), value }),
        computed(value, api.message.html.markdown)
      )
    ])
  }

  function bookLayout (msg, opts) {
    const { layout, obs, isEditing, isCard } = opts

    if (layout !== undefined && layout !== 'detail') return

    const { title, authors, description,
            series, seriesNo, images } = api.book.html

    let isEditingSubjective = Value(false)
    let originalSubjective = {}
    let originalBook = {}
    let reviews = []

    return [h('Message -book-detail', [
      title({ title: obs.title, msg, isEditing, onUpdate: obs.title.set }),
      authors({authors: obs.authors, isEditing, onUpdate: obs.authors.set}),
      series({ series: obs.series, seriesNo: obs.seriesNo, msg, isEditing,
               onUpdate: obs.series.set, onUpdateNo: obs.seriesNo.set }),
      h('section.content', [
        images({images: obs.images, isEditing, onUpdate: obs.images.add }),
        h('section.description',
          description({description: obs.description, isEditing, onUpdate: obs.description.set})),
      ]),
      h('section.actions', [
        h('button.edit', { 'ev-click': () => {
          if (isEditing()) { // cancel
            Object.keys(originalBook).forEach((v) => {
              obs[v].set(originalBook[v])
            })
          } else
            originalBook = JSON.parse(JSON.stringify(obs()))

          isEditing.set(!isEditing())
        } },
          when(isEditing, 'Cancel', 'Edit book')),
        when(isEditing, h('button', {'ev-click': () => saveBook(obs)}, 'Update book'))
      ]),
      h('section.subjective', [
        computed(obs.subjective, subjectives => {
          let i = 0;
          Object.keys(subjectives).forEach(user => {
            if (i++ < reviews.length) return
            let subjective = obs.subjective.get(user)
            let isMe = Value(api.keys.sync.id() == user)
            let isOwnEditingSubj = computed([isEditingSubjective, isMe],
                                            (e, me) => { return e && me })
            let showRating = computed([subjective.rating, isEditingSubjective],
                                      (v, e) => { return v || e })
            reviews.push([
              h('section',
                [api.about.html.image(user),
                 when(showRating, h('span.text', [api.about.obs.name(user), ' rated '])),
                 ratingEdit(isOwnEditingSubj, subjective.rating),
                 ratingTypeEdit(isOwnEditingSubj, subjective.ratingType)]),
              simpleEdit(isOwnEditingSubj, 'Shelve', subjective.shelve),
              simpleEdit(isOwnEditingSubj, 'Genre', subjective.genre),
              textEdit(isOwnEditingSubj, 'Review', subjective.review)
            ])
          })

          return reviews
        })
      ]),
      h('section.actions', [
        h('button.subjective', {
          'ev-click': () => {
            if (isEditingSubjective()) { // cancel
              let subj = obs.subjective.get(api.keys.sync.id())
              Object.keys(originalSubjective).forEach((v) => {
                subj[v].set(originalSubjective[v])
              })
            } else
              originalSubjective = JSON.parse(JSON.stringify(obs.subjective.get(api.keys.sync.id())()))

            isEditingSubjective.set(!isEditingSubjective())
          }
        },
          when(isEditingSubjective, 'Cancel', 'Edit my rating')),
        when(isEditingSubjective, h('button', { 'ev-click': () => saveSubjective(obs) }, 'Update rating'))
      ]),
    ])]

    function saveBook(obs) {
      obs.amend()

      isEditing.set(false)
    }

    function saveSubjective(obs) {
      obs.updateSubjective()

      isEditingSubjective.set(false)
    }
  }
}
