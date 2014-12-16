/* jshint evil: true */

var acute = require("./acute");

/**
* Parser
*
* TODO: Array access on scope.
*
*/


// Captures any sequence of operators.
var operatorCharsRegExp = /^[+\-=%*\/&|]+/;

// Supported operators:
// +, -, =, ==, ===, *, /, &&, ||
var validOperatorRegExp = /^(?:\+{1}|-{1}|={1,3}|\*|\/|&&|\|\|)$/;

// A path such as "user", "user.name" or "user.colors[2]".
var pathRegExp = /^[a-zA-Z$_]+[a-zA-Z0-9$_.]*/;

// Reserved words.
var reservedWordRegExp = /^true|false|null|undefined|new|Date$/;

// Matches anything that lools like an interger or float.
var numberRegExp = /^-?(?:\d+\.\d+|\.\d+|\d+)/;

// Separates an expresssion and optional pipe chain.
// var exprPipeChainRegExp = /^(.*?)\s*(?:\|[^\\]\s*(.+))?$/;
// var exprPipeChainRegExp = /^(.*?)$/;
var exprPipeChainRegExp = /^(.*?[^|])(?:\|[^|](.*))?$/;

module.exports = {
  parse: parse,
  tokenize: tokenize,
  groupTokens: groupTokens,
  getSource: getSource
};

var cache = exports.cache = {};

function parse ( expr ) {
  var cached = cache[expr];
  if ( cached ) {
    return cached;
  }

  // `getSource()` will assign keys for accessed scope paths.
  var watchedPaths = {};

  // Separate expression from pipe chain.
  var match = expr.match(exprPipeChainRegExp);

  var tokens = tokenize(match[1]);
  groupTokens(tokens);
  var source = getSource(tokens, watchedPaths);

  if ( match[2] ) {
    var pipeSource = parsePipeChain(match[2], watchedPaths);
    source = "scope.pipe(" + pipeSource + ", " + source + ", pathObj)";
  }

  var evalFn;
  try {
    evalFn = new Function("scope, pathObj", "return " + source);
    evalFn.watches = acute.keys(watchedPaths);
    cache[expr] = evalFn;
  } catch ( ex ) {
    console.log(ex, source);
  }

  return evalFn;
}

/**
* Parses a pipe chain expression.
*
* @param {String} pipeChainExpr
* @param {Object} watchedPaths An object to add scope paths to.
*/
function parsePipeChain ( pipeChainExpr, watchedPaths ) {
  var pipeExprs = pipeChainExpr.split("|");
  var pipes = [];

  for ( var i = 0; i < pipeExprs.length; i++ ) {
    var tokens = tokenize(pipeExprs[i]);

    // First token should be the pipe name.
    var name = tokens.shift();

    if ( tokens.length ) {
      // Remove any preceeding comma.
      if ( tokens[0].type === "L" && tokens[0].value === "," ) {
        tokens.shift();
      }
    }

    groupTokens(tokens);

    var source = getSource(tokens, watchedPaths);
    pipes.push("['" + name.value + "', [" + source + "]]");
  }

  return "[" + pipes.join(", ") + "]";
}

/**
* Tests a pattern against the current index of the buffer and
* if it matches, moves the index to the position where the match ended.
*
* @param {Buffer} buffer
* @param {RegExp} pattern
* @return {Array|null} the matched regular expression.
*/
function grab ( buffer, pattern ) {
  var match = buffer.contents.substr(buffer.index).match(pattern);
  if ( match ) {
    buffer.index += match[0].length - 1;
    return match;
  }
}

/**
* Creates a `Buffer`, a simple object that keeps track of the contents,
* current index and length of a string.
*
* @param {String}
* @return {Buffer}
*/
function createBuffer ( contents ) {
  return {
    contents: contents,
    index: 0,
    length: contents.length
  };
}

/**
* Parses an expression into an array of tokens in the form:
*
* `{ type: "type", value: "value" }`.
*
* Types:
*
* - "P" - Path of on the scope.
* - "O" - Operator.
* - "S" - String.
* - "L" - Literal.
*
* TODO: Combine store strings as literal tokens.
* TODO: Handle escaped quotes.
*
* @param {String} expr
* @param {Array} an array of tokens.
*/
function tokenize ( expr ) {
  var tokens = [];
  var stack = [];
  var buffer = createBuffer(expr);

  var inString = false;
  var quoteChr = null;

  var openObjectBraces = 0;
  var inObjectKey = false;

  var wordStartIndex;
  var lastLiteralChr;
  var match;

  while ( buffer.index < buffer.length ) {
    var chr = buffer.contents.charAt(buffer.index);
    if ( inString ) {
      if ( chr === quoteChr ) {
        inString = false;
        quoteChr = null;
        tokens.push({ type: "L", value: "'" + buffer.contents.substr(wordStartIndex, buffer.index - wordStartIndex) + "'" });
      }
    } else if ( chr === "'" || chr === '"' ) {
      inString = true;
      quoteChr = chr;
      wordStartIndex = buffer.index + 1;
    }
    else if ( (match = grab(buffer, numberRegExp)) ) {
      tokens.push({ type: "L", value: match[0] });
    }
    else if ( (match = grab(buffer, operatorCharsRegExp)) ) {
      if ( validOperatorRegExp.test(match[0]) ) {
        tokens.push({ type: "O", value: match[0] });
      } else {
        throw new Error("Invalid operator '" + match[0] + "'");
      }
    }
    else if ( (match = grab(buffer, pathRegExp)) ) {
      var path = match[0];
      if ( inObjectKey ) {
        tokens.push({ type: "L", value: "'" + path + "'" });
      } else {
        tokens.push({
          type: reservedWordRegExp.test(path) ? "L" : "P",
          value: path
        });
      }
    }
    else if ( chr === "(" ) {
      // Push the current level of tokens on the stack
      // to create a deeper level.
      stack.push(tokens);
      tokens = [];
    }
    else if ( chr === ")" ) {
      // Done with this level of tokens.
      var children = tokens;

      if ( stack.length ) {
        tokens = stack.pop();
      } else {
        throw new Error("Unbalanced parentheses");
      }

      if ( tokens.length ) {
        // There is a higher level of tokens on the stack, so add this level as children of it.
        var parent = tokens[tokens.length - 1];
        if ( parent.type === "P" ) {
          parent.children = children;
        } else {
          throw new Error("Exec non-word");
        }
      } else {
        // We're back at the root level, so prepend all of the tokens
        // back, making sure to add back the opening and closing parentheses.
        children.unshift({ type: "L", value: "(" });
        children.push({ type: "L", value: ")" });
        tokens = children.concat(tokens);
      }
    }
    else if ( chr !== " " ) {
      lastLiteralChr = chr;

      // Handle object key state.
      if ( chr === "{" ) {
        openObjectBraces++;
        inObjectKey = true;
      } else if ( chr === "}" ) {
        openObjectBraces--;
        if ( openObjectBraces === 0 ) {
          inObjectKey = false;
        }
      } else if ( openObjectBraces > 0 ) {
        if ( inObjectKey ) {
          if ( chr === ":" ) {
            inObjectKey = false;
          }
        } else {
          if ( chr === "," ) {
            inObjectKey = true;
          }
        }
      }

      tokens.push({ type: "L", value: chr });
    }

    buffer.index++;
  }

  return tokens;
}

/**
* Groups all tokens together recursively.
*
* @param {Array<Token>} tokens
*/
function groupTokens ( tokens ) {
  groupOperators(tokens);

  for ( var i = 0; i < tokens.length; i++ ) {
    var token = tokens[i];
    if ( token.children ) {
      groupTokens(token.children);
    }
  }
}

/**
* Loops through a list of tokens, grouping all operators
* with their left-hand side (lhs) and right-hand side (rhs)
* tokens based on the standard order of operations.
*
* @param {Array<Token>} tokens
*/
function groupOperators ( tokens ) {
  var op = findHighestPriorityOperator(tokens);
  while ( op ) {
    createGroupToken(op, tokens);
    op = findHighestPriorityOperator(tokens);
  }
}

/**
* Replaces the operator token in the list of tokens
* with a `group` token that points to the left and right
* tokens on each side of the operator, as well as the operator
* itself.
*
* @param {Token} op An operator token.
* @param {Array<Token>} tokens
*/
function createGroupToken ( op, tokens ) {
  var index = op.index;
  if ( index > 0 && index < tokens.length - 1 ) {
    var group = {
      type: "G",
      lhs: tokens[index - 1],
      op: op.token,
      rhs: tokens[index + 1]
    };
    tokens.splice(index - 1, 3, group);
  } else {
    throw new Error("cannot group op token on edge: " + acute.toJson(op));
  }
}

// A map of operator values to their priority.
// Higher values are prioritized first. Based on the standard order of
// operations: http://en.wikipedia.org/wiki/Order_of_operations.
var operatorPriority = {
  "!": 10,
  "*": 9, "%": 9, "/": 9,
  "+": 8, "-": 8,
  "==": 7, "===": 7, "!=": 7, "!==": 7,
  "&&": 6,
  "||": 5,
  "=": 4
};

/**
* Finds the highest priority operator token in a list of tokens.
*
* @param {Array} tokens An array of tokens.
*/
function findHighestPriorityOperator ( tokens ) {
  var highest = 0;
  var index = 0;

  for ( var i = 0, len = tokens.length; i < len; i++ ) {
    var token = tokens[i];
    if ( token.type === "O" ) {
      var p = operatorPriority[token.value];
      if ( p > highest ) {
        highest = p;
        index = i;
      }
    }
  }

  if ( highest ) {
    return {
      token: tokens[index],
      index: index
    };
  }
}

/**
* Transforms a list of tokens to source code, while also keeping track
* of scope paths that are accessed.
*
* @param {Array<Token>} tokens
* @param {Object} watchedPaths An object to add scope paths to.
* @return {String} Source code representation of tokens.
*/
function getSource ( tokens, watchedPaths ) {
  var source = "";
  for ( var i = 0, len = tokens.length; i < len; i++ ) {
    var token = tokens[i];
    source += transformToken(token, watchedPaths);
  }
  return source;
}

/**
* Transforms a token to source code.
*
* @param {Token} token
* @param {Object} watchedPaths An object to add scope paths to.
* @return {String} Source code representation of token.
*/
function transformToken ( token, watchedPaths ) {
  var type = token.type;
  var value = token.value;

  if ( type === "G" ) {
    if ( token.op.value === "=" ) {
      // Assignment.
      var source = "";
      if ( token.lhs.type === "P" ) {
        source += "scope.set('" + token.lhs.value + "', ";
      } else {
        throw new Error("Cannot assign left value of non variable");
      }
      return source + transformToken(token.rhs, watchedPaths) + ")";
    }
    if ( token.lhs.value === ")" ) {
      return transformToken(token.op, watchedPaths) + transformToken(token.rhs, watchedPaths) + ")";
    }
    return "(" + transformToken(token.lhs, watchedPaths) + transformToken(token.op, watchedPaths) + transformToken(token.rhs, watchedPaths) + ")";
  }
  else if ( type === "L" ) {
    return value;
  }
  else if ( type === "O" ) {
    if ( value !== "(" && value !== ")" ) {
      return " " + value + " ";
    }
    return "";
  }
  else if ( type === "P" ) {
    watchedPaths[value] = 1;
    if ( token.children ) {
      if ( token.children.length ) {
        return "scope.exec('" + value + "'," + getSource(token.children, watchedPaths) + ")";
      }
      return "scope.exec('" + value + "')";
    }
    return "scope.get('" + value + "')";
  }
  throw new Error("Unexpected token '" + token.type + "', '" + token.value + "'");
}
