(function () {

  var acute = window.acute = {};

  /**
  * Utilities
  */

  var objectClass = "[object Object]";
  var arrayClass = "[object Array]";
  var functionClass = "[object Function]";
  var toString = Object.prototype.toString;

  acute.isPlainObject = isPlainObject;
  function isPlainObject ( value ) {
    return value && typeof value == "object" && toString.call(value) == objectClass && !isArray(value);
  }

  acute.isArray = isArray;
  function isArray ( value ) {
    return value && typeof value == "object" && typeof value.length == "number" &&
      toString.call(value) == arrayClass || false;
  }

  function isFunction ( value ) {
    return value && toString.call(value) == functionClass;
  }

  /**
  * Observer
  */

  // var adaptorInterface = {
  //   subscribe: function ( obj, path, callback ) {
  //   },
  //   unsubscribe: function ( obj, path, callback ) {
  //   },
  //   read: function ( obj, path ) {
  //   },
  //   publish: function ( obj, path ) {
  //   }
  // };

  var adaptor = {
    subscribe: function ( obj, path, callback ) {
      makeObservable(obj);
      obj.$on(path, callback);
    },
    unsubscribe: function ( obj, path, callback ) {
    },
    read: function ( obj, path ) {
      acute.log("read", path, obj);

      var keys = path.split(".");
      for ( var i = 0, len = keys.length; i < len; i++ ) {
        var key = keys[i];

        // acute.log(key);

        obj = obj[key];

        // if ( i < len - 1 ) {
        //   if ( !obj ) {
        //     return;
        //   }

        //   obj = obj[key];
        // } else {
        //   return obj[key];
        // }
      }

      if ( isFunction(obj) ) {
        return obj();
      }

      return obj;

      // return obj[path];
    },
    publish: function ( obj, path ) {
    }
  };

  /**
  * Bind
  */

  var ELEMENT_NODE = 1;
  var ATTRIBUTE_NODE = 2;
  var TEXT_NODE = 3;
  var COMMENT_NODE = 8;

  acute.bind = function ( element, model ) {
    if ( element.hasChildNodes() ) {
      var childNodes = [];
      var i, len;

      // //
      // for ( i = 0, len = element.childNodes.length; i < len; i++ ) {
      //   childNodes.push(element.childNodes[i]);
      // }

      for ( var i = 0, len = element.childNodes.length; i < len; i++ ) {
        var node = element.childNodes[i];
        if ( !node ) {
          acute.log("node removed at index", i);
          continue;
        }

        var nodeType = node.nodeType;
        // acute.log("node", node);

        if ( nodeType === ELEMENT_NODE ) {
          processDirectives(node, model);

          acute.bind(node, model);
        }
        else if ( nodeType === TEXT_NODE ) {
          // acute.log("text", node.nodeValue);
          interpolateTextNode(node, model);
        }
      }
    }
  };

  function BoundDirective () {

  }

  acute.directives = {};

  function processDirectives ( node, model ) {
    var attributes = node.attributes;

    for ( var i = 0, len = attributes.length; i < len; i++ ) {
      var attr = attributes[i];
      var directive = acute.directives[attr.name];
      if ( directive ) {
        acute.log("attr", attr);
        // var bound = new BoundDirective();
        // bound.model = model;

        acute.log("directive", directive);
        directive.bind(node, attr, model);
        // directive.bind.call(view, node);
      }
    }
  }

  acute.directives["ac-each-item2"] = {
    bind: function ( element, attr, model ) {
      acute.log("bind", attr, attr.value);

      adaptor.subscribe(model, attr.value, function () {
        // acute.log("changed show");
      });
      // element.parentNode.removeChild(element);
    },
    unbind: function ( element ) {

    },
    routine: function () {

    }
  };

  acute.directives["ac-show"] = {
    bind: function ( element, attr, model ) {
      acute.log("ac-show", attr.value, model);

      var updateFn = function () {
        var value = adaptor.read(model, attr.value);
        acute.log("changed show", value);
        if ( value ) {
          element.style.display = "block";
        } else {
          element.style.display = "none";
        }
      };

      adaptor.subscribe(model, attr.value, updateFn);
    },
    unbind: function ( element, model ) {

    }
  };

  function subscribe ( obj, path, callback ) {
    // var keys = path.split(".");
    // for ( var i = 0, len = keys.length; i < len; i++ ) {

    // }
  }

  function makeObservable ( obj ) {
    if ( typeof obj === "object" && !obj.$on ) {
      obj.$listeners = [];

      obj.$on = function ( path, callback ) {
        obj.$listeners.push({ path: path, callback: callback });
      };

      obj.$off = function ( path, callback ) {
        var listeners = obj.$listeners;
        for ( var index = listeners.length - 1; index >= 0; index-- ) {
          var listener = listeners[index];
          if ( listener.path === path && listener.callback === callback ) {
            listeners.splice(index, 1);
          }
        }
      };

      obj.$emit = function ( path ) {
        var listeners = obj.$listeners;
        for ( var i = 0, len = listeners.length; i < len; i++ ) {
          if ( !path || listeners[i].path === path ) {
            listeners[i].callback();
          }
        }
      };

      obj.$update = function ( path, value ) {
        if ( arguments.length > 1 ) {
          obj[path] = value;
        }
        obj.$emit(path);
      };
    }
  }

  var interpolateRegExp = /\{\s*([\w\.]+)\s*(?:|(.*))?\}/g;

  function interpolateTextNode ( node, model ) {
    var text = node.nodeValue;

    var watch = {};
    var watchCount = 0;

    var source = ('return "' + text.replace(interpolateRegExp, function ( line, path, filters ) {
      watch[path] = true;
      watchCount++;
      // acute.log("interpolate path", path);
      return '" + read(model, "' + path + '") + "';
    }) + '"').replace(/[\r\n]/g, "\\n");

    if ( watchCount ) {
      acute.log(source);

      var replaceFn = new Function("read, model", source);

      var updateFn = function () {
        if ( node ) {
          node.nodeValue = replaceFn(adaptor.read, model);
        }
      };

      for ( var path in watch ) {
        adaptor.subscribe(model, path, updateFn);
      }

      updateFn(model);
    }
  }

  /**
  * Logging utilities
  *
  * Defines: acute.log, acute.enableLog, acute.disableLog
  */
  (function () {
    function noOp () {}

    acute.log = noOp;

    acute.enableLog = function () {
      var console = window.console;
      var consoleLog = console && console.log;

      if ( consoleLog ) {
        if ( Function.prototype.bind ) {
          // acute.log = consoleLog.bind(console);
          acute.log = Function.prototype.bind.call(consoleLog, console);
        } else if ( consoleLog.apply ) {
          acute.log = function acuteLog () {
            consoleLog.apply(console, Array.prototype.slice.call(arguments));
          };
        } else {
          acute.log = function acuteLog () {
            consoleLog(Array.prototype.slice.call(arguments).join(", "));
          };
          acute.log("---------- acute log enabled --------");
        }
      };
    };

    acute.disableLog = function () {
      logFn = noOp;
    };

    acute.enableLog();
  }());

  /**
  * Expression Parser
  */
  acute.parseExpr = (function () {
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
      acute.log("transformed: ", transformed.buffer);
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
          notifyChange(context, prop, compiledFn.onUpdate);
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

})(this);
