var ref = require("referee")
var espree = require("espree")
var assert = ref.assert;
var refute = ref.refute;
var cmts = require("./index.js")
var fs = require("fs")

describe("parsing",function() {
  it("only takes comment content from point of first TODO/FIXME onwards",function() {
    var input = firstComment("foo\nbar\n/* TODO baz\nanother line */")
    var output = cmts.findTodo(input)
    assert.equals(output.value, "TODO baz\nanother line ")
  })
  it("sets type correctly",function() {
    var input = firstComment("foo\nbar\n/* TODO baz\nanother line */")
    var output = cmts.findTodo(input)
    assert.equals(output.type, "todo")
  })
  it("returns correct start line for todo in multi-line todos ",function() {
    var input = firstComment([
      "/*",
      " *",
      "* TODO*/"
    ].join("\n"))
    var output = cmts.findTodo(input)
    assert.equals(3,output.loc.start.line)
    assert.equals(2,output.loc.start.character)
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

  it("handles shebang lines", function() {
    var todos = cmts("#!/usr/bin/env node\nfoo\nbar\n/* TODO baz\nanother line */");

    assert.equals(todos.length, 1);
  });

  it("handles es6", function() {
    var todos = cmts("`some es6`\nfoo\nbar\n/* TODO baz\nanother line */");

    assert.equals(todos.length, 1);
  });
})

function readExamples(path) {
  var src = fs.readFileSync(path,"utf-8")
  return espree.parse(src,{comment: true,loc: true})
}
function firstComment(src) {
  return espree.parse(src,{comment: true,loc: true}).comments[0]
}
