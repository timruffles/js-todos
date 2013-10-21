# JS-TODOs

Find todos in JS code. Uses esprima, so robust.

```
# ./node_modules/.bin on path? if not, install with --global / -g
npm install js-todos
js-todos *.js
```

## Options

- --outputter - set output
-- json: outputs as list of todos
-- default: human readable format
- --nostatus - disable exit status (to invoke via process spawing)

## API

### jsTodos(source)

Main function - takes javascript source, parses, return todos.

### jsTodos.findTodo(comment)

Takes an Esprima AST comment and parses for TODO/FIXME. Returns comment with added todo type field, or undefined if no todo was found. 

### jsTodos.commentsToTodos(comments)

Runs `findTodo` on each comment, returns an array of all todos found.

### jsTodos.readAll(paths,output)

Runs `jsTodos()` over JS source found at each path, and calls `output()`. `output` is a function with parameters `output(todo,path)`. It'll be called once for each path before todos are found: `output(path)`. Once for each todo with path: `output(path,todo)`. Finally it'll be called once with the string `"complete"` after all paths have been read: `output("complete")`. This is to allow outputters to either output on the go, or cache all data and output a formatted display on complete.  

To define an outputter add it to `jsTodos.outputter`. It should be a function that takes an options object (the command line options defined above) and returns a function that responds to the above calls. See the (JSON outputter)[index.js#L103] for an example of how to write an outputter.

## Configuration

## jsTodos.types

Add functions to this array that take a comment and return an todo if found. An todo contains the same fields (`value`, `loc` etc) with an added `type` field - by default `'TODO'` and `'FIXME'`, but add your own.

Example:

```
jsTodos.types.push(function(comment) {
  if(/WTF/.test(comment.value)) {
    comment.type = "WTF"
    return comment
  }
})
```


