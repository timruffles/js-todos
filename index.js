/* eslint-disable no-use-before-define */
/* eslint-disable no-console */
/* eslint-disable sort-keys */
/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */

const espree = require('espree');
const fs = require('fs');
require('colors'); // extends string proto

const todoRe = commentSafeRe('todo');
const fixmeRe = commentSafeRe('fixme');

// public API
function findTodos(src) {
  src = stripShebang(src);
  const ast = espree.parse(src, { loc: true, comment: true, ecmaVersion: 9 });

  return findTodos.commentsToTodos(ast.comments);
}

findTodos.findTodo = (comment) => {
  let found;
  findTodos.types.some((fn) => {
    const issue = fn(comment);
    if (issue) {
      found = issue;

      return found;
    }
  });

  return found;
};

findTodos.commentsToTodos = (comments) => {
  const all = [];
  comments.forEach((comment) => {
    const issue = findTodos.findTodo(comment);
    if (issue) {
      all.push(issue);
    }
  });

  return all;
};

findTodos.types = [
  (comment) => {
    let found;
    [{ re: todoRe, type: 'todo' }, { re: fixmeRe, type: 'fixme' }].some((setup) => {
      const match = setup.re.exec(comment.value);
      if (!(match)) {
        return;
      }
      comment.type = setup.type;
      const linesBefore = comment.value.slice(0, match.index).split(/\n/g);
      if (linesBefore.length > 0) {
        comment.loc.start.line += linesBefore.length - 1;
        comment.loc.start.character = linesBefore[linesBefore.length - 1].length;
        comment.value = comment.value.slice(match.index);
      }

      found = comment;

      return found;
    });

    return found;
  },
];

// output
findTodos.readAll = (paths, output) => {
  paths.forEach((path) => {
    output(null, path);
    try {
      const issues = findTodos(fs.readFileSync(path, 'utf-8'));
      issues.forEach((issue) => {
        output(issue, path);
      });
    } catch (e) {
      console.error(`Error processing ${path}:${e}`);
      process.exit(1);
    }
  });
  output('complete');
};

findTodos.outputters = {
  default(opts) {
    const paths = {};
    let total = 0;
    const byType = {};
    function finish() {
      const pathCount = Object.keys(paths).length;
      console.log('');
      if (total === 0) {
        return console.log(`${'PASSED'.green} scanned ${pathCount} ${pluralize('file', pathCount)}, no todos found`);
      }
      const filesWithTodos = Object.keys(paths).filter(path => paths[path].length > 0).length;
      const typeString = Object.keys(byType).map((type) => {
        const count = byType[type].length;

        return `${count} ${type}`;
      }).join(', ');
      // eslint-disable-next-line max-len
      console.log(`${'FAILED'.red} found ${total} todos in ${filesWithTodos} ${pluralize('file', filesWithTodos)}: ${typeString}`);
      console.log('');
      Object.keys(paths).forEach((path) => {
        const issues = paths[path];
        if (issues.length === 0) {
          return;
        }
        console.log(`${path}:`);
        issues.forEach((issue) => {
          console.log(`:${issue.loc.start.line} ${issue.value}`);
        });
        console.log('');
      });
      if (!opts.nostatus) {
        process.exit(total === 0 ? 0 : 1);
      }
    }

    return (issue, path) => {
      if (issue === 'complete') {
        return finish();
      }
      paths[path] = paths[path] || [];
      if (!issue) {
        return;
      }
      total += 1;
      paths[path].push(issue);
      byType[issue.type] = byType[issue.type] || [];
      byType[issue.type].push(issue);
    };
  },
  json(opts) {
    const all = [];

    return (issue, path) => {
      if (!issue) {
        return;
      }
      if (issue === 'complete') {
        console.log(JSON.stringify(all));
        if (!opts.nostatus) {
          process.exit(all.length === 0 ? 0 : 1);
        }
      }
      issue.path = path;
      all.push(issue);
    };
  },
};

function pluralize(str, n) {
  return n === 1 ? str : `${str}s`;
}
function commentSafeRe(word) {
  const options = [
    `\\b${word.toUpperCase()}\\b`,
    `@${word}\\b`,
  ].join('|');

  return new RegExp(options);
}


function stripShebang(src) {
  return src.replace(/^#![^\n]*/, '');
}

module.exports = findTodos;
