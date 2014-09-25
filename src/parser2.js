acute.parser2 = (function () {

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
  var numberRegExp = /^-?(?:\.\d+|\d+|\d+\.\d+)/;

  function parse ( expr ) {
    var tokens = tokenize(expr);
    groupOperators(tokens);
    console.log(JSON.stringify(tokens, null, 2));
    var source = getSource(tokens);
    return source;
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

    var wordStartIndex;
    var match;

    while ( buffer.index < buffer.length ) {
      var chr = buffer.contents.charAt(buffer.index);
      if ( inString ) {
        if ( chr === quoteChr ) {
          inString = false;
          quoteChr = null;
          tokens.push({ type: "S", value: buffer.contents.substr(wordStartIndex, buffer.index - wordStartIndex) });
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
        tokens.push({
          type: reservedWordRegExp.test(match[0]) ? "L" : "P",
          value: match[0]
        });
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
        tokens.push({ type: "L", value: chr });
      }

      buffer.index++;
    }

    return tokens;
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
      throw new Error("cannot group op token on edge: " + JSON.stringify(op));
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
  * Transforms a list of tokens to source code.
  *
  * @param {Array<Token>} tokens
  * @return {String} Source code representation of tokens.
  */
  function getSource ( tokens ) {
    var source = "";
    for ( var i = 0, len = tokens.length; i < len; i++ ) {
      var token = tokens[i];
      source += transformToken(token);
    }
    return source;
  }

  /**
  * Transforms a token to source code.
  *
  * @param {Token} token
  * @return {String} Source code representation of token.
  */
  function transformToken ( token ) {
    var type = token.type;
    var value = token.value;

    if ( type === "G" ) {
      if ( token.op.value === "=" ) {
        // Assignment.
        var source = "(";
        if ( token.lhs.type === "P" ) {
          source += "scope.set('" + token.lhs.value + "', ";
        } else {
          throw new Error("Cannot assign left value of non variable");
        }
        return source + transformToken(token.rhs) + ")";
      }
      if ( token.lhs.value === ")" ) {
        return transformToken(token.op) + transformToken(token.rhs) + ")";
      }
      return "(" + transformToken(token.lhs) + transformToken(token.op) + transformToken(token.rhs) + ")";
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
    else if ( type === "S" ) {
      return "'" + value + "'";
    }
    else if ( type === "P" ) {
      if ( token.children ) {
        return "scope.exec('" + value + "',[" + getSource(token.children) + "])";
      }
      return "scope.get('" + value + "')";
    }
    return "####";
  }

  return {
    parse: parse,
    groupOperators: groupOperators,
    getSource: getSource
  };

}());
