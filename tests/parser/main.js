var parse = (function () {
  var objectStartRegExp = /\s*\{\s*/g;
  var objectEndRegExp = /\s*\}\s*/g;
  var objectPropRegExp = /\s*((?:,\s*)?[a-zA-Z0-9$_\-'"]+)\s*/g;
  var objectColonRegExp = /\s*:\s*/g;

  var arrayStartRegExp = /\s*\[\s*/g;
  var arrayEndRegExp = /\s*\]\s*/g;

  var literalRegExp = /(\s*[\d.]+|true|false|null|undefined|new|Date\s*)/g;
  var propertyRegExp = /\s*([a-zA-Z_$]+[a-zA-Z0-9_$.]*)\s*/g;
  var operatorRegExp = /(\s*\+|-|!|==|===|\*|\/\s*)/g;
  var assignmentRegExp = /\s*=\s*/g;
  var commaRegExp = /\s*,\s*/g;

  var punctuationRegExp = /\s*([()])/g;

  var execStartRegExp = /\s*\(\s*/g;
  var execEndRegExp = /\s*\)/g;

  var filterOpRegExp = /\s*\|/g;
  var filterNameRegExp = /\s*([a-zA-Z_$]+[a-zA-Z0-9_$]*)/g;

  var input;
  var index = 0;
  var output = "";
  var $M = [];

  // Punctuation.
  var openParenCount = 0;

  var inFilter = false;
  var filterBuffer = "";

  var exprStack = [];

  // Expression stack.
  var exprs = [];

  function parse ( str ) {
    input = str;
    index = 0;

    var count = 0;
    console.debug(input);
    while ( expression() ) {
      count++;
    }
    console.debug(output);
    console.debug("expresssion count: ", count);
    console.debug(exprStack);
    console.debug(exprs);

    return output;
  }

  function parse ( input ) {
    var index = 0;
    var length = input.length;
    var output = "";

    function getBetween ( openChr, closeChr, escapeChr ) {
      var openCount = 0;
      var isEscaped = false;
      var buffer = "";
      var chr;

      // 2 + 2)

      // "matthew\" Lee Benton"

      while ( index < length ) {
        chr = input.charAt(index);
        if ( chr === escapeChr ) {
          isEscaped = !isEscaped
        }
        else if ( chr === openChr ) {
          openCount++;
        }
        else if ( chr === closeChr ) {
          if ( isEscaped ) {
            isEscaped = false;
          }
          else if ( openCount ) {
            openCount--;
          }
          else {
            index++;
            return buffer;
          }
        }
        index++;
        buffer += chr;
      }
    }

    return output;
  }

  function pushExpr ( fn ) {
    var idx = output.length;
    if ( fn() ) {
      exprs.push(output.substr(idx));
      return true;
    }
  }

  function logGroup ( name ) {
    console.log("%c%s", "color: #9933cc;", name);
  }

  function match ( pattern ) {
    pattern.lastIndex = index;
    var result = pattern.exec(input);
    if ( result ) {
      var str = result[0];
      if ( (pattern.lastIndex - str.length) === index ) {
        console.log("    match", pattern, $M, input.substr(index), true);
        $M = result.slice(1);
        index = pattern.lastIndex;
        return true;
      }
    }
    console.log("    match", pattern, input.substr(index), false);
  }

  function expression () {
    logGroup("expression [" + input.substr(index) + "]");
    if ( index < input.length ) {
      var idx = output.length;
      var result = (filter() || object() || array() || literal() || property() || operator() || comma() || punctuation());
      if ( result ) {
        exprStack.push(output.substr(idx));
        return true;
      }
    }
  }

  function filter () {
    logGroup("filter");
    if ( match(filterOpRegExp) ) {
      inFilter = true;
      filterBuffer = output;
      output = "";
      return true;
    }

    if ( inFilter && match(filterNameRegExp) ) {
      var name = $M[0];
      append("filter('" + name + "', " + filterBuffer + ")");
      filterBuffer = false;
      inFilter = false;
      return true;
    }
  }

  function punctuation () {
    logGroup("punctuation");
    if ( match(punctuationRegExp) ) {
      var chr = $M[0];

      if ( chr === "(" ) {
        openParenCount++;
        append(chr);
      }
      else if ( chr === ")" ) {
        if ( openParenCount ) {
          openParenCount--;
          append(chr);
        } else {
          // There aren't any open parentheses so revert things
          // since we might be in an exec() block.
          index--;
          return false;
        }
      }
      return true;
    }
  }

  function comma () {
    logGroup("comma");
    if ( match(commaRegExp) ) {
      append(", ");
      return true;
    }
  }

  function object () {
    logGroup("object");
    if ( match(objectStartRegExp) ) {
      append("{ ");
      while ( objectProp() ) {}
      if ( match(objectEndRegExp) ) {
        append(" }");
        return true;
      }
    }
  }

  function array () {
    logGroup("array");
    if ( match(arrayStartRegExp) ) {
      append("[");
      while ( expression() ) {}
      if ( match(arrayEndRegExp) ) {
        append("]");
        return true;
      }
    }
  }

  function objectProp () {
    logGroup("objectProp");
    if ( match(objectPropRegExp) ) {
      append($M[0]);
      if ( match(objectColonRegExp) ) {
        append(": ");
        if ( expression() ) {
          return true;
        }
      }
    }
  }

  function literal () {
    logGroup("literal");
    if ( match(literalRegExp) ) {
      append($M[0]);
      return true;
    }

    if ( string() ) {
      append($M[0]);
      return true;
    }
  }

  function string () {
    logGroup("string [" + input.substr(index) + "]");

    var chr = input.charAt(index);
    if ( chr === "'" || chr === '"' ) {
      var buffer = chr;
      var quote = chr;
      var isEscaped = false;
      var length = input.length;

      while ( index < length ) {
        chr = input.charAt(++index);
        if ( chr === "\\" ) {
          isEscaped = !isEscaped;
        } else if ( chr === quote ) {
          if ( isEscaped ) {
            isEscaped = false;
          } else {
            $M[0] = buffer + chr;
            index++;
            console.log("    matched");
            return true;
          }
        }
        buffer += chr;
      }
    }
    console.log("    no match");
  }

  function property () {
    logGroup("property [" + input.substr(index) + "]:" + index);
    if ( match(propertyRegExp) ) {
      var prop = $M[0];
      if ( operator() ) {
        append("get('" + prop + "')");
        if ( expression() ) {
          return true;
        }
      } else if ( assignment(prop) ) {
        return true;
      } else if ( exec(prop) ) {
        return true;
      } else {
        append("get('" + prop + "')");
        return true;
      }
    }
  }

  function exec ( prop ) {
    logGroup("exec");
    if ( match(execStartRegExp) ) {
      append("exec('" + prop + "')(");

      // Check for functions without any arguments,
      // otherwise punctionation() group will mess this up.
      if ( match(execEndRegExp) ) {
        append(")");
        return true;
      }

      // There should be arguments since we reached this point.
      var count = 0;
      while ( expression() ) {
        count++;
      }

      if ( match(execEndRegExp) ) {
        append(")");
        return true;
      }
    }
  }

  function append ( str, pushExpr ) {
    output += str;
    console.log("%c+ %s", "color: green;", str);
    if ( pushExpr ) {
      exprs.push(str);
    }
  }

  function operator () {
    logGroup("operator");
    if ( match(operatorRegExp) ) {
      append($M[0]);
      return true;
    }
  }

  function assignment ( prop ) {
    logGroup("assignment");
    if ( match(assignmentRegExp) ) {
      return pushExpr(function () {
        append("set('" + prop + "', ");
        operator();
        if ( expression() ) {
          append(")");
          return true;
        }
      });
    }
  }

  return parse;
}());
