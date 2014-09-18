/**
* Parser
*
* TODO: cache constant values as return type
*/

/* jshint evil: true */

// acute.createGetter = createGetter;
// var GETTER_EXPR_CACHE = {};

// function createGetter ( expr ) {
//   var cached = GETTER_EXPR_CACHE[expr];
//   if ( cached ) {
//     return cached;
//   }

//   var parts = expr.split(".");
//   var buffer = "ctx";
//   var exprs = [buffer];
//   var indices;

//   function replaceIndex ( line, index ) {
//     indices.push(index);
//     return "";
//   }

//   while ( parts.length ) {
//     var part = parts.shift();
//     indices = [];
//     part = part.replace(/\[(.+?)\]/g, replaceIndex);
//     buffer += "." + part;
//     exprs.push(buffer);

//     while ( indices.length ) {
//       var index = indices.shift();
//       buffer += "[" + index + "]";
//       exprs.push(buffer);
//     }
//   }

//   var getFn = new Function("ctx, def", "return " + exprs.join(" && ") + " || def");
//   GETTER_EXPR_CACHE[expr] = getFn;
//   return getFn;
// }

function escapePattern ( pattern ) {
  return pattern.replace(/([(){}.])/g, "\\$1");
}

acute.parser = (function () {
  var parser = {};

  var digitRegExp = /\d/;
  var propStartRegExp = /[a-z_$]/i;
  var propRegExp = /[a-z_$0-9\.]/i;
  var fullPropRegExp = /^[a-z_$]+[\.a-z0-9_$]*$/i;
  var keywordRegExp = /^true|false|null|undefined$/;
  var execEmptyArgsRegExp = /^\s*\)/;

  var noop = function () {};
  var cache = {};

  parser.parse = parse;
  function parse ( expr ) {
    if ( cache[expr] ) {
      return cache[expr];
    }

    var source;
    var watches;

    // Separate expression from any filter chain.
    var match = expr.match(/^(.*?)(?:\s*\|\s*(.*))?$/);
    if ( match ) {
      var transformed = transform(match[1]);
      source = transformed.buffer.replace(/;$/, "").replace(/;/g, ",");
      watches = transformed.watches;

      if ( match[2] ) {
        transformed = transformFilters(source, transformed.watches, match[2]);
        source = transformed.buffer;
        watches = transformed.watches;
      }
    }

    console.log(source);

    var evalFn = new Function("scope, filter", "return (" + source + ")");
    acute.trace.p("compiled " + expr + " --> " + evalFn.toString() + ", watches:", watches);
    cache[expr] = evalFn;
    evalFn.watches = watches;
    return evalFn;
  }

  var defaultAccessors = {
    get: {
      start: "scope.get(",
      end: ")"
    },
    set: {
      start: "scope.set(",
      end: ")"
    },
    exec: {
      start: "scope.exec(",
      end: ""
      // end: ", "
    }
  };

  function transformFilters ( source, watches, filterStr ) {
    var rawFilters = filterStr.split("|");
    var watchedPaths = {};
    var i, j, len;

    for ( i = 0, len = watches.length; i < len; i++ ) {
      watchedPaths[watches[i]] = true;
    }

    // for ( i = 0, len = rawFilters.length; i < len; i++ ) {
    //   var raw = rawFilters[i];
    //   var nameMatch = raw.match(/^\s*([a-zA-Z$_]+[a-zA-Z0-9$_]*)\s*/);
    //   if ( nameMatch ) {
    //     var name = nameMatch[1];
    //     // Remove name part.
    //     raw = raw.substr(nameMatch[0].length);

    //     var trans = transform(raw);
    //     if ( trans && trans.buffer ) {
    //       // Remove any preceeding comma.
    //       var buffer = trans.buffer.replace(/^\s*,\s*/, "");
    //       source = "filter('" + name + "', " + buffer + ", " + source + ")";

    //       for ( j = 0; j < trans.watches.length; j++ ) {
    //         watchedPaths[trans.watches[i]] = true;
    //       }
    //     } else {
    //       source = "filter('" + name + "', " + source + ")";
    //     }
    //   }
    // }

    var filters = [];
    for ( i = 0, len = rawFilters.length; i < len; i++ ) {
      var raw = rawFilters[i];
      var nameMatch = raw.match(/^\s*([a-zA-Z$_]+[a-zA-Z0-9$_]*)\s*/);
      if ( nameMatch ) {
        var name = nameMatch[1];
        // Remove name part.
        raw = raw.substr(nameMatch[0].length);

        var trans = transform(raw);
        if ( trans && trans.buffer ) {
          // Remove any preceeding/trailing whitespace and commas.
          var buffer = trans.buffer.replace(/^\s*,|,\s*$/, "");
          filters.push("['" + name + "', [" + buffer + "]]");

          for ( j = 0; j < trans.watches.length; j++ ) {
            watchedPaths[trans.watches[i]] = true;
          }
        } else {
          filters.push("['" + name + "']");
        }
      }
    }

    if ( filters.length ) {
      watches = [];
      for ( var path in watchedPaths ) {
        watches.push(path);
      }

      source = "filter([" + filters.join(", ") + "], " + source + ")";
    }

    return {
      buffer: source,
      watches: watches
    };
  }

  parser.transform = transform;
  function transform ( expr, accessors ) {
    if ( !accessors ) {
      accessors = defaultAccessors;
    }

    var _get = accessors.get;
    var _set = accessors.set;
    var _exec = accessors.exec;

    if ( fullPropRegExp.test(expr) ) {
      return {
        // expr: expr,
        buffer: _get.start + "'" + expr + "'" + _get.end,
        // hasGet: true,
        // hasSet: false,
        // hasExec: false,
        watches: [expr]
        // assignExpr: _set.start + "'" + expr + "'" + _set.end
      };
    }

    // Character index.
    var i, j;

    // The output.
    var buffer = "";

    // Object literals.
    var inObject = false;
    var isObjectField = false;
    var isObjectValue = false;

    // Property capture.
    var isProperty = false;
    var propStartIndex = 0;

    // Strings.
    var isString = false;
    var quote = null;
    var isEscaped = false;

    // Accessors used.
    var hasGet = false;
    var hasSet = false;
    var hasExec = false;

    var execInit = false;

    // function checkExecHasArgs ( subStr ) {
    // }

    function startProperty () {
      isProperty = true;
      propStartIndex = i;
    }

    function endProperty ( isFunctionCall ) {
      isProperty = false;

      execInit = isFunctionCall;

      var prop = expr.substr(propStartIndex, i - propStartIndex);

      if ( keywordRegExp.test(prop) ) {
        buffer += prop;
      } else {
        if ( isFunctionCall ) {
          buffer += _exec.start + "'" + prop + "'" + _exec.end;
          hasExec = true;
        } else {
          buffer += _get.start + "'" + prop + "'" + _get.end;
          hasGet = true;
        }
      }
    }

    // Parse the expression.
    for ( i = 0, j = expr.length; i < j; i++ ) {
      var chr = expr[i];

      if ( execInit ) {
        // Immediately after append "exec('name'"
        if ( !execEmptyArgsRegExp.test(expr.substr(i)) ) {
          // Should have arguments.
          buffer += ", ";
        }
        execInit = false;
      }

      if ( isString ) {
        if ( chr === "\\" ) {
          isEscaped = !isEscaped;
        } else if ( chr === quote && !isEscaped ) {
          isString = false;
        }
        buffer += chr;
      }
      else if ( chr === "'" || chr === '"' ) {
        isString = true;
        quote = chr;
        buffer += chr;
      }
      else if ( chr === "{" ) {
        inObject = true;
        isObjectField = true;
        buffer += chr;
      }
      else if ( chr === ":" && isObjectField ) {
        isObjectField = false;
        buffer += chr;
      }
      else if ( chr === "," && inObject ) {
        isObjectField = true;
        if ( isProperty ) {
          endProperty();
        }
        buffer += chr;
      }
      else if ( !isObjectField && !isProperty && propStartRegExp.test(chr) ) {
        startProperty();
      }
      else if ( isProperty ) {
        if ( !propRegExp.test(chr) ) {
          if ( chr === "(" ) {
            endProperty(true);
          } else {
            endProperty(false);
            buffer += chr;
          }
          // Sep 18, 2014 - Removed to shift exec() args inside.
          // buffer += chr;
        }
      }
      else if ( !isProperty ) {
        buffer += chr;
      }
    }

    if ( isProperty ) {
      endProperty(false);
    }

    var assignRegExp = new RegExp(escapePattern(_get.start) + "'([^']+)'" + escapePattern(_get.end) + "\\s*=[^=]\\s*([^;]+)", "g");
    acute.trace.p('assignRegExp', assignRegExp);

    acute.trace.p(buffer);

    buffer = buffer.replace(assignRegExp, function ( line, prop, value ) {
      acute.trace.p('assign', line, prop, value);
      hasSet = true;
      return _set.start + "'" + prop + "', " + value + _set.end;
    });

    var captureOpRegExp = new RegExp(
      "(?:" +
      escapePattern(_get.start) + "|" +
      // escapePattern(_set.start) + "|" +
      escapePattern(_exec.start) + ")" +
      "'([^']+)", "g");

    acute.trace.p("captureOpRegExp", captureOpRegExp, buffer);

    var watchedPaths = {};
    buffer.replace(captureOpRegExp, function ( line, path ) {
      watchedPaths[path] = true;
    });

    acute.trace.p("transformed", buffer);

    var watches = [];
    for ( var path in watchedPaths ) {
      watches.push(path);
    }

    return {
      buffer: buffer,
      // hasGet: hasGet,
      // hasSet: hasSet,
      // hasExec: hasExec,
      watches: watches
    };
  }

  return parser;
}());
