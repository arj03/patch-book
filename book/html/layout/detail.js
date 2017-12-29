const nest = require('depnest')
const { h, when, computed, Value, map } = require('mutant')
const addSuggest = require('suggest-box')

exports.needs = nest({
  'book.obs.book': 'first',
  'about.html.image': 'first',
  'about.obs.name': 'first',
  'keys.sync.id': 'first',
  'emoji.async.suggest': 'first',
  'message.html': {
    markdown: 'first'
  },
  'book.html': {
    title: 'first',
    authors: 'first',
    series: 'first',
    description: 'first',
    images: 'first',
    simpleEmoji: 'first'
  }
})

exports.gives = nest('book.html.layout')

exports.create = (api) => {
  return nest('book.html.layout', bookLayout)

  function ratingEdit(isEditing, value) {
    return when(isEditing,
      h('input', {
        'ev-input': e => value.set(e.target.value),
        value,
        placeholder: 'your rating'
      }),
      h('span.text', { innerHTML: computed(value, api.book.html.simpleEmoji) })
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
                h('span.text', { innerHTML: computed(value, api.book.html.simpleEmoji) }))
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

  function saveSubjective(obs, isEditingSubjective) {
    obs.updateSubjective()
    isEditingSubjective.set(false)
  }

  function handleSubjective(user, i, obs) {
    let originalSubjective = {}
    let isEditingSubjective = Value(false)
    let subjective = obs.subjective.get(user)
    let isMe = Value(api.keys.sync.id() == user)
    let isOwnEditingSubj = computed([isEditingSubjective, isMe],
                                    (e, me) => { return e && me })
    let showRating = computed([subjective.rating, isEditingSubjective, isMe],
                              (v, e, me) => { return v || (e && me) })

    function editRatingClick() {
      if (isEditingSubjective()) { // cancel
        if (obs.subjective.has(api.keys.sync.id())) {
          let subj = obs.subjective.get(api.keys.sync.id())
          Object.keys(originalSubjective).forEach((v) => {
            subj[v].set(originalSubjective[v])
          })
        }
      } else {
        if (obs.subjective.has(api.keys.sync.id()))
          originalSubjective = JSON.parse(JSON.stringify(obs.subjective.get(api.keys.sync.id())()))
      }

      isEditingSubjective.set(!isEditingSubjective())
    }

    return [
      h('section',
        [api.about.html.image(user),
         h('span.text', [api.about.obs.name(user), when(showRating, ' rated ')]),
         ratingEdit(isOwnEditingSubj, subjective.rating),
         ratingTypeEdit(isOwnEditingSubj, subjective.ratingType)]),
      simpleEdit(isOwnEditingSubj, 'Shelve', subjective.shelve),
      simpleEdit(isOwnEditingSubj, 'Genre', subjective.genre),
      textEdit(isOwnEditingSubj, 'Review', subjective.review),
      h('section.comments', map(subjective.comments, com => {
        return h('div',
                 [api.about.html.image(com.author),
                  // FIXME: time, in general like cards
                  h('span.text', computed(com.content.text, api.message.html.markdown))])
      })),
      h('section.actions',
        when(isMe, [
          h('button.subjective', { 'ev-click': editRatingClick },
            when(isEditingSubjective, 'Cancel', 'Edit my rating')),
          when(isEditingSubjective,
               h('button', { 'ev-click': () => saveSubjective(obs, isEditingSubjective) },
                 'Update rating'))
        ]))
    ]
  }

  function bookLayout(msg, opts) {
    const { layout, obs, isEditing, isCard } = opts

    if (layout !== undefined && layout !== 'detail') return

    const { title, authors, description,
            series, seriesNo, images } = api.book.html

    let originalBook = {}
    let reviews = []

    function editClick() {
      if (isEditing()) { // cancel
        Object.keys(originalBook).forEach((v) => {
          obs[v].set(originalBook[v])
        })
      } else
        originalBook = JSON.parse(JSON.stringify(obs()))

      isEditing.set(!isEditing())
    }

    return [h('Message -book-detail', [
      title({ title: obs.title, msg, isEditing, onUpdate: obs.title.set }),
      series({ series: obs.series, seriesNo: obs.seriesNo, msg, isEditing,
               onUpdate: obs.series.set, onUpdateNo: obs.seriesNo.set }),
      authors({authors: obs.authors, isEditing, onUpdate: obs.authors.set}),
      h('section.content', [
        images({images: obs.images, isEditing, onUpdate: obs.images.add }),
        h('section.description',
          description({description: obs.description, isEditing, onUpdate: obs.description.set})),
      ]),
      h('section.actions', [
        h('button.edit', { 'ev-click': editClick },
          when(isEditing, 'Cancel', 'Edit book')),
        when(isEditing, h('button', {'ev-click': () => saveBook(obs)}, 'Update book'))
      ]),
      h('section.subjective', [
        computed(obs.subjective, subjectives => {
          let i = 0;
          Object.keys(subjectives).forEach(user => {
            if (i++ < reviews.length) return
            reviews.push(handleSubjective(user, i, obs))
          })

          return reviews
        })
      ])
    ])]

    function saveBook(obs) {
      obs.amend()

      isEditing.set(false)
    }
  }
}
