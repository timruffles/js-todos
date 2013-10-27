var esprima = require("esprima")

// public API
function findTodos(src) {
  var ast = esprima.parse(src,{loc: true,comment: true});
  return cmts.commentsToTodos(ast.comments);
}

var cmts = module.exports = findTodos;

cmts.findTodo = function(comment) {
  var found
  cmts.types.some(function(fn) {
    var issue
    if(issue = fn(comment)) {
      return found = issue
    }
  })
  return found
}

cmts.commentsToTodos = function(comments) {
  var all = []
  comments.forEach(function(comment) {
    var issue = cmts.findTodo(comment)
    if(issue) all.push(issue)
  })
  return all
};

cmts.types = [
  function(comment) {
    var val = comment.value
    var found
    [{re:todoRe, type:"todo"},{re:fixmeRe, type:"fixme"}].some(function(setup) {
      var match
      if(!(match = setup.re.exec(comment.value))) return
      comment.type = setup.type
      var linesBefore = comment.value.slice(0,match.index).split(/\n/g)
      if(linesBefore.length > 0) {
        comment.loc.start.line += linesBefore.length - 1
        comment.loc.start.character = linesBefore[linesBefore.length - 1].length
        comment.value = comment.value.slice(match.index)
      }
      return found = comment
    })
    return found
  }
]
var todoRe = commentSafeRe("todo")
var fixmeRe = commentSafeRe("fixme")

// output
cmts.readAll = function(paths,output) {
  var fs = require("fs")
  paths.forEach(function(path) {
    output(null,path)
    try {
      var issues = cmts(fs.readFileSync(path,"utf-8"))
      issues.forEach(function(issue) {
        output(issue,path)
      })
    } catch(e) {
      console.error("Error processing " + path + ":" + e);
      process.exit(1)
    }
  })
  output("complete")
}

cmts.outputters = {
  default: function(opts) {
    require("colors") // extends string proto
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
      if(!opts.nostatus) process.exit(total === 0 ? 0 : 1)
    }
    return function(issue,path) {
      if(issue === "complete") return finish()
      paths[path] = paths[path] || []
      if(!issue) return;
      total += 1
      paths[path].push(issue)
      byType[issue.type] = byType[issue.type] || []
      byType[issue.type].push(issue)
    }
  },
  json: function(opts) {
    var all = []
    return function(issue,path) {
      if(!issue) return;
      if(issue === "complete") {
        console.log(JSON.stringify(all))
        if(!opts.nostatus) process.exit(all.length === 0 ? 0 : 1)
      }
      issue.path = path
      all.push(issue)
    }
  }
}

function pluralize(str,n) {
  return n === 1 ? str : str + "s"
}
function commentSafeRe(word) {
  var options = [
    '\\b' + word.toUpperCase() + '\\b',
    '@' + word + '\\b'
  ].join("|") 
  return new RegExp(options);
}

