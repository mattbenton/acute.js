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

  var noop = function () {};
  var cache = {};

  parser.parse = parse;
  function parse ( expr ) {
    if ( cache[expr] ) {
      return cache[expr];
    }

    var transformed = transform(expr);
    var source = transformed.buffer.replace(/;$/, "").replace(/;/g, ",");
    var evalFn = new Function("scope", "return (" + source + ")");
    // acute.trace.p("compiled " + expr + " --> " + evalFn.toString() + ", gets:", transformed.gets, "sets:", transformed.sets, "execs:", transformed.execs);
    acute.trace.p("compiled " + expr + " --> " + evalFn.toString() + ", watches:", transformed.watches);
    cache[expr] = evalFn;

    evalFn.watches = transformed.watches;

    // var compiledFn = compile(transformed);
    // cache[expr] = compiledFn;

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
      end: ")"
    }
  };

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
        expr: expr,
        buffer: _get.start + "'" + expr + "'" + _get.end,
        hasGet: true,
        hasSet: false,
        hasExec: false,
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

    function startProperty () {
      isProperty = true;
      propStartIndex = i;
    }

    function endProperty ( isFunctionCall ) {
      isProperty = false;

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
      else if ( !isObjectField && !isProperty && propStartRegExp.test(chr) ) {
        startProperty();
      }
      else if ( isProperty ) {
        if ( !propRegExp.test(chr) ) {
          if ( chr === "(" ) {
            endProperty(true);
          } else {
            endProperty(false);
          }
          buffer += chr;
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
    acute.trace.p(assignRegExp);

    acute.trace.p(buffer);

    // buffer = buffer.replace(/get\('([^']+)'\)\s*=[^=]\s*([^;]+)/g, function ( line, prop, value ) {
    buffer = buffer.replace(assignRegExp, function ( line, prop, value ) {
      acute.trace.p(line, prop, value);
      hasSet = true;
      return _set.start + "'" + prop + "', " + value + _set.end;
    });

    // acute.trace.p("transformed", buffer);

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

    var watches = [];
    for ( var path in watchedPaths ) {
      watches.push(path);
    }

    // var gets = {};
    // var sets = {};
    // var execs = {};

    // // acute.trace.p("captureOpRegExp", captureOpRegExp);
    // buffer.replace(captureOpRegExp, function ( line, op, path ) {
    //   // acute.trace.p("op", op, "path", path);
    //   var count;
    //   if ( op === _get.start ) {
    //     count = gets[path] || 0;
    //     gets[path] = count + 1;
    //   }
    //   else if ( op === _set.start ) {
    //     count = sets[path] || 0;
    //     sets[path] = count + 1;
    //   }
    //   else if ( op === _exec.start ) {
    //     count = execs[path] || 0;
    //     execs[path] = count + 1;
    //   }
    // });

    return {
      buffer: buffer,
      hasGet: hasGet,
      hasSet: hasSet,
      hasExec: hasExec,
      watches: watches
    };
  }

  // parser.compile = compile;
  // function compile ( transformed ) {
  //   acute.trace.p("transformed: ", transformed.buffer);
  //   var compiledExprFn = new Function("get, exec, assign", "return " + transformed.buffer);
  //   var compiledFn;

  //   if ( !transformed.hasGet && !transformed.hasExec && !transformed.hasSet ) {
  //     // Result is constant so this is simple.
  //     var result = compiledExprFn();
  //     compiledFn = function () {
  //       return result;
  //     };
  //     compiledFn.constant = true;
  //     return compiledFn;
  //   }

  //   compiledFn = function ( context, locals ) {
  //     var getFn = transformed.hasGet && function ( prop ) {
  //       if ( locals ) {
  //         var value = getValue(locals, prop);
  //         if ( typeof value !== "undefined" ) {
  //           return value;
  //         }
  //       }
  //       if ( context ) {
  //         return getValue(context, prop);
  //       }
  //     };

  //     var execFn = transformed.hasExec && function ( prop ) {
  //       var value = locals && locals[prop];
  //       if ( isFunction(value) ) {
  //         notifyChange(context, prop, compiledFn.onUpdate);
  //         return value;
  //       }
  //       value = context && context[prop];
  //       if ( isFunction(value) ) {
  //         notifyChange(context, prop, compiledFn.onUpdate);
  //         return value;
  //       }
  //       return noop;
  //     };

  //     var assignFn = transformed.hasSet && function ( prop, value ) {
  //       assignValue(context, prop, value);
  //       notifyChange(context, prop, compiledFn.onUpdate);
  //     };

  //     return compiledExprFn(getFn, execFn, assignFn);
  //   };

  //   if ( transformed.assignExpr ) {
  //     var assignExprFn = new Function("assign", transformed.assignExpr);
  //     compiledFn.assign = function ( context, value ) {
  //       var assignFn = function ( prop ) {
  //         assignValue(context, prop, value);
  //       };
  //       assignExprFn(assignFn);
  //       notifyChange(context, prop, compiledFn.onUpdate);
  //     };
  //   }

  //   return compiledFn;
  // }

  // function getValue ( context, prop ) {
  //   if ( context ) {
  //     var keys = prop.split(".");
  //     var key, child;
  //     while ( keys.length ) {
  //       key = keys.shift();
  //       if ( keys.length ) {
  //         child = context[key];
  //         if ( typeof child === "undefined" ) {
  //           return;
  //         }
  //         context = child;
  //       } else {
  //         return context[key];
  //       }
  //     }
  //   }
  // }

  // function assignValue ( context, prop, value ) {
  //   if ( context ) {
  //     var keys = prop.split(".");
  //     var key, child;
  //     while ( keys.length ) {
  //       key = keys.shift();
  //       if ( keys.length ) {
  //         child = context[key];
  //         if ( !isPlainObject(child) || !isArray(child) ) {
  //           child = context[key] = {};
  //           context = child;
  //         }
  //       } else {
  //         context[key] = value;
  //       }
  //     }
  //   }
  // }

  // function notifyChange ( context, prop, callback ) {
  //   if ( callback ) {
  //     callback(context, prop);
  //   }

  //   if ( context instanceof Scope ) {
  //     // Find the scope on which `prop` exists.
  //     var scope = context;
  //     while ( scope && !scope.hasOwnProperty(prop) ) {
  //       scope = scope.$parent;
  //     }

  //     if ( scope ) {
  //       // Has to execute on next tick because exec() is called after notify.
  //       setTimeout(function() {
  //         scope.$digest();
  //       }, 0);
  //     }
  //   }
  // }

  return parser;
}());
