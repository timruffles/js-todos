var esprima = require("esprima")

var cmts;
module.exports = cmts = {
  analyseComments: function(src) {
    var ast = esprima.parse(src,{loc: true, comment: true});
    var comments = ast.comments;
    return ast;
  },
  readIssues: function(comment) {
    var found
    cmts.types.some(function(fn) {
      var issue
      if(issue = fn(comment)) {
        return found = issue
      }
    })
    return found
  },
  commentsToIssues: function(comments) {
    var all = []
    comments.forEach(function(comment) {
      var issue = cmts.readIssues(comment)
      if(issue) all.push(issue)
    })
    return all
  },
  todoRe: commentSafeRe("TODO"),
  fixmeRe: commentSafeRe("FIXME"),
  types: [
    function(comment) {
      var val = comment.value
      var found
      [cmts.todoRe,cmts.fixmeRe].some(function(re) {
        var match
        if(match = re.exec(comment.value)) {
          found = comment
          comment.type = match[1]
        }
      })
      return found
    }
  ]
}

function commentSafeRe(word) {
  return new RegExp('\\s*\\*?\\b' + '(' + word + ')' + '\\b');
}

