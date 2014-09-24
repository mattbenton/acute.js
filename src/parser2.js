var operatorRegExp = /^(?:\+|\+\+|-|--|={1,3}|\*|\/|&&|\|\|)/;
var wordRegExp = /^[a-zA-Z$_]+[a-zA-Z0-9$_.]*/;
var reservedWordRegExp = /^true|false|null|undefined|new|Date$/;
var numberRegExp = /^(?:\.\d+|\d+|\d+\.\d+)/;

function grab ( buffer, pattern ) {
  var match = buffer.contents.substr(buffer.index).match(pattern);
  if ( match ) {
    buffer.index += match[0].length - 1;
    return match;
  }
}

function createBuffer ( contents ) {
  return {
    contents: contents,
    index: 0,
    length: contents.length
  };
}

function tokenize ( expr ) {
  var tokens = [];
  var buffer = createBuffer(expr);

  var inString = false;
  var quoteChr = null;

  var wordStartIndex;
  var match;

  while ( buffer.index < buffer.length ) {
    var chr = buffer.contents.charAt(buffer.index);
    // console.log("chr", chr);

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
    else if ( (match = grab(buffer, operatorRegExp)) ) {
      tokens.push({ type: "O", value: match[0] });
    }
    else if ( (match = grab(buffer, wordRegExp)) ) {
      tokens.push({
        type: reservedWordRegExp.test(match[0]) ? "L" : "W",
        value: match[0]
      });
    }
    else if ( (match = grab(buffer, numberRegExp)) ) {
      tokens.push({ type: "L", value: match[0] });
    }
    else if ( chr !== " " ) {
      tokens.push({ type: "L", value: chr });
    }

    buffer.index++;
  }

  console.log("tokens", JSON.stringify(tokens, null, 2));
  return tokens;
}

function groupTokens ( tokens ) {
  var op = findHighestPriorityOperator(tokens);
  if ( !op ) {
    console.log("@#@");
  }
  while ( op ) {
    groupOpToken(op, tokens);
    op = findHighestPriorityOperator(tokens);
  }
  console.log("tokens", JSON.stringify(tokens, null, 2));
}

function groupOpToken ( op, tokens ) {
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

var priorities = {
  "!": 10,
  "*": 9, "%": 9, "/": 9,
  "+": 8, "-": 8,
  "==": 7, "===": 7, "!=": 7, "!==": 7,
  "&&": 6,
  "||": 5,
  "=": 4
};

function findHighestPriorityOperator ( tokens ) {
  var highest = 0;
  var index = 0;

  for ( var i = 0, len = tokens.length; i < len; i++ ) {
    var token = tokens[i];
    if ( token.type === "O" ) {
      var p = priorities[token.value];
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

function transform ( tokens ) {
  var source = "";

  for ( var i = 0, len = tokens.length; i < len; i++ ) {
    var token = tokens[i];
    // if ( token.value !== "(" && token.value !== ")" ) {
      source += transformToken(token);
    // }
  }

  return source;
}

function transformToken ( token ) {
  var type = token.type;
  var value = token.value;

  if ( type === "G" ) {

    if ( token.op.value === "=" ) {
      var source = "(";
      if ( token.lhs.type === "W" ) {
        source += "scope.set('" + token.lhs.value + "', ";
      } else {
        throw new Error("Cannot assign left value of non variable");
      }
      return source + transformToken(token.rhs) + ")";
    }

    if ( token.lhs.value === ")" ) {
      return transformToken(token.op) + transformToken(token.rhs) + ")";
    }

    // return source + transformToken(token.op) + transformToken(token.rhs) + ")";
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
    // return "" + value + "";
  }
  else if ( type === "S" ) {
    return "'" + value + "'";
  }
  else if ( type === "W" ) {
    return "scope.get('" + value + "')";
  }
  return "####";
}

// var expr = "name = 'Matthew', true";
// var expr = "10 == 7 + 3";
// var expr = "{ 's-minimized': widget.isMinimized, 's-loading': widget.isLoading }";
// var expr = "2 + 5 * 10 * 3";
// var expr = "(10 - 4) / 2";
var expr = "matt(), fred()";
var tokens = tokenize(expr);
groupTokens(tokens);
console.debug(transform(tokens));
