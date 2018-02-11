/* eslint-disable no-use-before-define */

const ref = require('referee');
const espree = require('espree');

const assert = ref.assert;
const refute = ref.refute;
const cmts = require('./index.js');
const fs = require('fs');

describe('parsing', () => {
  it('only takes comment content from point of first TODO/FIXME onwards', () => {
    const input = firstComment('foo\nbar\n/* TODO baz\nanother line */');
    const output = cmts.findTodo(input);
    assert.equals(output.value, 'TODO baz\nanother line ');
  });
  it('sets type correctly', () => {
    const input = firstComment('foo\nbar\n/* TODO baz\nanother line */');
    const output = cmts.findTodo(input);
    assert.equals(output.type, 'todo');
  });
  it('returns correct start line for todo in multi-line todos ', () => {
    const input = firstComment([
      '/*',
      ' *',
      '* TODO*/',
    ].join('\n'));
    const output = cmts.findTodo(input);
    assert.equals(3, output.loc.start.line);
    assert.equals(2, output.loc.start.character);
  });
  const positives = readExamples('./positive-fixtures.js').comments;
  positives.forEach((comment, i) => {
    it(`reads a TODO correctly from example ${i + 1}`, () => {
      const issue = cmts.findTodo(comment);
      assert(issue, `No issue found in \n${comment.value}`);
    });
  });
  const negatives = readExamples('./negative-fixtures.js').comments;
  negatives.forEach((comment, i) => {
    it(`correct sees no issues in example ${i + 1}`, () => {
      const issue = cmts.findTodo(comment);
      refute(issue, `False positive in \n${comment.value}`);
    });
  });

  it('handles shebang lines', () => {
    const todos = cmts('#!/usr/bin/env node\nfoo\nbar\n/* TODO baz\nanother line */');

    assert.equals(todos.length, 1);
  });

  it('handles es6', () => {
    const todos = cmts('`some es6`\nfoo\nbar\n/* TODO baz\nanother line */');

    assert.equals(todos.length, 1);
  });

  it('handles es9', () => {
    const todos = cmts('const x = {...y};\nfoo\nbar\n/* TODO baz\nanother line */');

    assert.equals(todos.length, 1);
  });
});

function readExamples(path) {
  const src = fs.readFileSync(path, 'utf-8');

  return espree.parse(src, { comment: true, loc: true });
}
function firstComment(src) {
  return espree.parse(src, { comment: true, loc: true }).comments[0];
}
