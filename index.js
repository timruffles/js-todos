var esprima = require("esprima")

function findTodos(src) {
  var ast = esprima.parse(src,{loc: true,comment: true});
  return cmts.commentsToIssues(ast.comments);
}

var cmts = module.exports = findTodos;
cmts.readIssues = function(comment) {
  var found
  cmts.types.some(function(fn) {
    var issue
    if(issue = fn(comment)) {
      return found = issue
    }
  })
  return found
}
cmts.commentsToIssues = function(comments) {
  var all = []
  comments.forEach(function(comment) {
    var issue = cmts.readIssues(comment)
    if(issue) all.push(issue)
  })
  return all
};
var todoRe = commentSafeRe("TODO")
var fixmeRe = commentSafeRe("FIXME")
cmts.types = [
  function(comment) {
    var val = comment.value
    var found
    [todoRe,fixmeRe].some(function(re) {
      var match
      if(match = re.exec(comment.value)) {
        found = comment
        comment.type = match[1]
      }
    })
    return found
  }
]
function pluralize(str,n) {
  return n === 1 ? str : str + "s"
}
cmts.outputters = {
  default: function() {
    var colors = require("colors")
    var paths = {}
    var total = 0
    var byType = {}
    function finish() {
      var pathCount = Object.keys(paths).length
      console.log("")
      if(total === 0) {
        return console.log("PASSED".green + " scanned " + pathCount + " " + pluralize("file",pathCount) + ", no todos found")
      }
      var filesWithTodos = Object.keys(paths).filter(function(path) {
        return paths[path].length > 0
      }).length
      var typeString = Object.keys(byType).map(function(type) {
        var count = byType[type].length
        return count + " " + type
      }).join(", ")
      console.log("FAILED".red + " found " + total + " todos in " + filesWithTodos + " " + pluralize("file",filesWithTodos) + ": " + typeString)
      console.log("")
      Object.keys(paths).forEach(function(path) {
        var issues = paths[path]
        if(issues.length === 0) return;
        console.log(path + ":")
        issues.forEach(function(issue) {
          console.log(":" + issue.loc.start.line + " " + issue.value)
        })
        console.log("")
      })
      process.exit(total === 0 ? 0 : 1)
    }
    return function(issue,path) {
      if(issue === "complete") return finish()
      paths[path] = paths[path] || []
      if(!issue) return
      total += 1
      paths[path].push(issue)
      byType[issue.type] = byType[issue.type] || []
      byType[issue.type].push(issue)
    }
  },
  json: function() {
    var all = []
    return function(issue,path) {
      if(!issue) return
      if(issue === "complete") {
        console.log(JSON.stringify(all))
        process.exit(all.length === 0 ? 0 : 1)
      }
      all.push(issue)
    }
  }
}

function commentSafeRe(word) {
  return new RegExp('\\s*\\*?\\b' + '(' + word + ')' + '\\b');
}

cmts.readAll = function(paths,output) {
  var fs = require("fs")
  paths.forEach(function(path) {
    output(null,path)
    var issues = cmts(fs.readFileSync(path,"utf-8"))
    issues.forEach(function(issue) {
      output(issue,path)
    })
  })
  output("complete")
}
