var ref = require("referee")
var esprima = require("esprima")
var assert = ref.assert;
var refute = ref.refute;
var cmts = require("./index.js")
var fs = require("fs")

describe("parsing",function() {
  var positives = readExamples("./positive-fixtures.js").comments
  positives.forEach(function(comment,i) {
    it("reads a TODO correctly from example " + (i + 1),function() {
      var issue = cmts.findTodo(comment)
      assert(issue,"No issue found in \n" + comment.value)
    });
  })
  var negatives = readExamples("./negative-fixtures.js").comments
  negatives.forEach(function(comment,i) {
    it("correct sees no issues in example " + (i + 1),function() {
      var issue = cmts.findTodo(comment)
      refute(issue,"False positive in \n" + comment.value)
    });
  })
})

function readExamples(path) {
  var src = fs.readFileSync(path,"utf-8")
  return esprima.parse(src,{comment: true})
}
