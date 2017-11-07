const bulk = require('bulk-require')

const modules = bulk(__dirname, ['!(node_modules|test|util)/**/*.js'], {
  require: function (module) {
    return module.match(/(.*.test.js$)/) ? null : require(module)
  }
})

module.exports = {
  'patch-book': modules
  // REVIEW - best to scope all depject module exports lest they over-ride each other
}
