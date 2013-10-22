var ref = require("referee")
var esprima = require("esprima")
var assert = ref.assert;
var refute = ref.refute;
var cmts = require("./index.js")
var fs = require("fs")

describe("parsing",function() {
  it("only takes comment content from point of first TODO/FIXME onwards",function() {
    var input = {value: "foo\n\bar\n TODO baz\nanother line"}
    var output = cmts.findTodo(input)
    assert.equals(output.value, "TODO baz\nanother line")
  })
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
