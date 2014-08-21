/**
* Parser
*
* TODO: cache constant values as return type
*/

var parseExpr = acute.parseExpr = (function () {
  var digitRegExp = /\d/;
  var propStartRegExp = /[a-z_$]/i;
  var propRegExp = /[a-z_$0-9\.]/i;
  var fullPropRegExp = /^[a-z_$]+[\.a-z0-9_$]*$/i;

  var keywordRegExp = /^true|false|null|undefined$/;

  var noop = function () {};

  var cache = {};

  function parse ( expr ) {
    if ( cache[expr] ) {
      return cache[expr];
    }

    var transformed = transform(expr);
    var compiledFn = compile(transformed);
    cache[expr] = compiledFn;

    return compiledFn;
  }

  function transform ( expr ) {
    if ( fullPropRegExp.test(expr) ) {
      return {
        expr: expr,
        buffer: "get('" + expr + "')",
        hasGet: true,
        hasExec: false,
        hasAssign: false,
        assignExpr: "assign('" + expr + "')"
      };
    }

    // Character index.
    var i;

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
    var hasExec = false;
    var hasAssign = false;

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
          buffer += "exec('" + prop + "')";
          hasExec = true;
        } else {
          buffer += "get('" + prop + "')";
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

    buffer = buffer.replace(/get\('([^']+)'\)\s*=\s*([^;]+)/g, function ( line, prop, value ) {
      hasAssign = true;
      return "assign('" + prop + "', " + value + ")";
    });

    return {
      buffer: buffer,
      hasGet: hasGet,
      hasExec: hasExec,
      hasAssign: hasAssign
    };
  }

  function compile ( transformed ) {
    console.log("transformed: ", transformed.buffer);
    var compiledExprFn = new Function("get, exec, assign", "return " + transformed.buffer);
    var compiledFn;

    if ( !transformed.hasGet && !transformed.hasExec && !transformed.hasAssign ) {
      // Result is constant so this is simple.
      var result = compiledExprFn();
      compiledFn = function () {
        return result;
      };
      compiledFn.constant = true;
      return compiledFn;
    }

    compiledFn = function ( context, locals ) {
      var getFn = transformed.hasGet && function ( prop ) {
        if ( locals ) {
          var value = getValue(locals, prop);
          if ( typeof value !== "undefined" ) {
            return value;
          }
        }
        if ( context ) {
          return getValue(context, prop);
        }
      };

      var execFn = transformed.hasExec && function ( prop ) {
        var value = locals && locals[prop];
        if ( isFunction(value) ) {
          notifyChange(context, prop, compiledFn.onUpdate);
          return value;
        }
        value = context && context[prop];
        if ( isFunction(value) ) {
          notifyChange(context, prop, compiledFn.onUpdate);
          return value;
        }
        return noop;
      };

      var assignFn = transformed.hasAssign && function ( prop, value ) {
        assignValue(context, prop, value);
      };

      return compiledExprFn(getFn, execFn, assignFn);
    };

    if ( transformed.assignExpr ) {
      var assignExprFn = new Function("assign", transformed.assignExpr);
      compiledFn.assign = function ( context, value ) {
        var assignFn = function ( prop ) {
          assignValue(context, prop, value);
        };
        assignExprFn(assignFn);
        notifyChange(context, prop, compiledFn.onUpdate);
      };
    }

    return compiledFn;
  }

  function getValue ( context, prop ) {
    if ( context ) {
      var keys = prop.split(".");
      var key, child;
      while ( keys.length ) {
        key = keys.shift();
        if ( keys.length ) {
          child = context[key];
          if ( typeof child === "undefined" ) {
            return;
          }
          context = child;
        } else {
          return context[key];
        }
      }
    }
  }

  function assignValue ( context, prop, value ) {
    if ( context ) {
      var keys = prop.split(".");
      var key, child;
      while ( keys.length ) {
        key = keys.shift();
        if ( keys.length ) {
          child = context[key];
          if ( !isPlainObject(child) || !isArray(child) ) {
            child = context[key] = {};
            context = child;
          }
        } else {
          context[key] = value;
        }
      }
    }
  }

  function notifyChange ( context, prop, callback ) {
    if ( callback ) {
      callback(context, prop);
    }

    if ( context instanceof Scope ) {
      // Find the scope on which `prop` exists.
      var scope = context;
      while ( scope && !scope.hasOwnProperty(prop) ) {
        scope = scope.$parent;
      }

      if ( scope ) {
        // Has to execute on next tick because exec() is called after notify.
        setTimeout(function() {
          scope.$digest();
        }, 0);
      }
    }
  }

  return parse;
}());
