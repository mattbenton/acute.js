(function ( factory ) {
  if ( typeof define !== "undefined" && define.amd ) {
    define(factory);
  } else {
    window.acute = factory();
  }
}(function () {
  var acute = {};

  /**
  * Helpers
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

  acute.extend = extend;
  function extend ( target ) {
    var sources = Array.prototype.slice.call(arguments, 1);
    for ( var i = 0, j = sources.length; i < j; i++ ) {
      var source = sources[i];
      for ( var prop in source ) {
        target[prop] = source[prop];
      }
    }
    return target;
  }

  var UNIQUE_ID_COUNT = 0;
  function nextUid () {
    return "$" + UNIQUE_ID_COUNT++;
  }

  /**
  * LinkedListAccessor
  */

  function LinkedListAccessor ( head, tail, prev, next ) {
    // item.prev = item.next = null;
    // if ( !head ) { head = item; }
    // if ( tail ) { tail.next = item; item.prev = tail; }
    // tail = item;
    this.append = new Function("o, i", "i." + prev + " = i." + next + " = null; if ( !o." + head + " ) { o." + head + " = i; } if ( o." + tail + " ) { o." + tail + "." + next + " = i; i." + prev + " = o." + tail + "; } o." + tail + " = i;");

    // item.prev = item.next = null;
    // if ( head ) { head.prev = item; item.next = head; }
    // head = item;
    // if ( !tail ) { tail = item; }
    this.prepend = new Function("o, i", "i." + prev + " = i." + next + " = null; if ( o." + head + " ) { o." + head + "." + prev + " = i; i." + next + " = o." + head + "; } o." + head + " = i; if ( !o." + tail + " ) { o." + tail + " = i; }");

    // if ( item.prev ) { item.prev.next = item.next; }
    // if ( item.next ) { item.next.prev = item.prev; }
    // if ( item === head ) { head = item.next; }
    // if ( item === tail ) { tail = item.prev; }
    // item.prev = item.next = null;
    this.remove = new Function("o, i", "if ( i." + prev + " ) { i." + prev + "." + next + " = i" + "." + next + "; } if ( i." + next + " ) { i." + next + "." + prev + " = i." + prev + "; } if ( i === o." + head + " ) { o." + head + " = i." + next + "; } if ( i === o." + tail + " ) { o." + tail + " = i." + prev + "; } i. " + prev + " = i." + next + " = null;");
  }

  /**
  * Constants
  */

  var ELEMENT_NODE = 1;
  var ATTRIBUTE_NODE = 2;
  var TEXT_NODE = 3;
  var COMMENT_NODE = 8;

  /**
  * App
  */

  var defaultDirectives = {};
  var defaultFilters = {};

  function App ( name, rootElement ) {
    this.name = name;

    this.rootElement = rootElement || document.body;

    this.rootScope = new Scope();
    this.rootScope.$root = this.rootScope;
    this.rootScope.$app = this;

    this.directives = extend({}, defaultDirectives);
    this.filters = extend({}, defaultFilters);

    compile(this, this.rootScope, this.rootElement);
  }

  App.prototype.directive = function ( name, options ) {
    this.directives[name] = options;
  };

  acute.app = function ( name, rootElement ) {
    return new App(name, rootElement);
  };

  /**
  * Watcher
  */

  var watcherAccessor = new LinkedListAccessor("head", "tail", "prev", "next");

  function Watcher () {
    this.head = null;
    this.tail = null;
  }

  Watcher.prototype.watch = function ( obj, field, handler ) {
    var record = {
      obj: obj,
      field: field,
      handler: handler
    };

    var value = obj && obj[field];
    // record.lastValue = value;
    // record.lastJson = JSON.stringify(value);

    watcherAccessor.append(this, record);

    // if ( !this.head ) {
    //   this.head = record;
    // }
    // if ( this.tail ) {
    //   this.tail.next = record;
    // }
    // this.tail = record;

    return function removeWatch () {
      watcherAccessor.remove(this, record);
    };
  };

  Watcher.prototype.digest = function () {
    var current = this.head;
    while ( current ) {
      var value = current.obj[current.field];
      var json = JSON.stringify(value);

      if ( value !== current.lastValue || json !== current.lastJson ) {
        // change
        // console.log("change", current.field, value, current.lastValue);
        current.handler(value, current.lastValue);

        current.lastValue = value;
        current.lastJson = json;
      }

      current = current.next;
    }
  };

  Watcher.prototype.poll = function ( intervalMs ) {
    intervalMs = intervalMs || 1000;

    if ( this.pollIntervalId ) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = nul;
    }

    if ( intervalMs > 0 ) {
      var that = this;
      this.pollIntervalId = setInterval(function () {
        that.digest();
      }, intervalMs);
    }

    this.digest();

    return this;
  };

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

  /**
  * Scope
  */

  var scopeChildListAccessor = new LinkedListAccessor("$childHead", "$childTail", "$prevSibling", "$nextSibling");

  function Scope () {
    this.$id = nextUid();
    this.$watcher = new Watcher();

    this.$childHead = null;
    this.$childTail = null;
  }

  Scope.prototype.$watch = function ( prop, handler ) {
    this.$watcher.watch(this, prop, handler);
  };

  Scope.prototype.$digest = function () {
    this.$watcher.digest();

    var child = this.$childHead;
    while ( child !== null ) {
      child.$digest();
      child = child.$nextSibling;
    }
  };

  Scope.prototype.$eval = function ( expr ) {
    var result = parseExpr(expr)(this);

    return result;
    // var code = prop.replace(/([a-z_$]+[a-z0-9_$]*)/gi, "this.$1");
    // return eval(code);

    var methodMatch = expr.match(/^\s*(?:\$\.)([\w\.]+)\((.*?)\)\s*$/);
    if ( methodMatch ) {
      var method = methodMatch[1];
      var args = methodMatch[2];

      if ( isFunction(this[method]) ) {
        // Method exists somewhere in prototype.
        // fn();

        var fn = new Function("$", expr);
        fn(this);

        // Find the scope on which it exists.
        var current = this;
        while ( current && !current.hasOwnProperty(method) ) {
          current = current.$parent;
        }

        console.debug("method " + method + ", exists on", current);
        if ( current ) {
          current.$digest();
        }
      }
    } else {
      var code = expr.replace(/([\w\.]+)/gi, "this.$1");
      console.log("eval", expr, code);
      return eval(code);
    }
  };

  Scope.prototype.$new = function ( isolate ) {
    var child;

    if ( isolate ) {
      child = new Scope();
    } else {
      var ChildScope = function () {};
      ChildScope.prototype = this;
      child = new ChildScope();

      child.$id = nextUid();
      child.$watcher = new Watcher();
    }

    child.$root = this.$root;
    child.$app = this.$app;
    child.$parent = this;
    child.$childHead = child.$childTail = null;

    scopeChildListAccessor.append(this, child);

    // if ( !this.$childHead ) {
    //   this.$childHead = child;
    // }
    // if ( this.$childTail ) {
    //   this.$childTail.$nextSibling = child;
    // }
    // this.$childTail = child;

    return child;
  };

  Scope.prototype.$destroy = function () {
    console.debug("$destroy", this);

    if ( this.$parent ) {
      scopeChildListAccessor.remove(this.$parent, this);
    }

    this.$root = this.$app = this.$parent = null;

    var child = this.$childHead;
    while ( child ) {
      child.$destroy();
      child = child.$nextSibling;
    }

    for ( var prop in this ) {
      if ( this.hasOwnProperty(prop) ) {
        this[prop] = null;
      }
    }
  };

  /**
  * Default directives
  */

  defaultDirectives["ng-show"] = {
    link: function ( scope, $element, attrs ) {
      var prop = attrs["ng-show"].value;
      var value = scope.$eval(prop);
      scope.$watch(prop, function ( value ) {
        $element.toggle(!!value);
      });
      $element.toggle(!!value);
    }
  };

  defaultDirectives["ng-hide"] = {
    link: function ( scope, $element, attrs ) {
      var prop = attrs["ng-hide"].value;
      var value = scope.$eval(prop);
      scope.$watch(prop, function ( value ) {
        $element.toggle(!!!value);
      });
      $element.toggle(!!!value);
    }
  };

  defaultDirectives["ng-click"] = {
    link: function ( scope, $element, attrs ) {
      var expr = attrs["ng-click"].value;
      $element.on("click", function () {
        scope.$eval(expr);
        // scope.$digest();
        console.log("click digest", scope);
      });
    }
  };

  defaultDirectives["ng-repeat"] = {
    link: function ( scope, $element, attrs ) {
      var expr = attrs["ng-repeat"].value;
      var match = expr.match(/for\s+(\w+)\s+in\s+(.+)/);
      if ( match ) {
        var iterator = match[1];
        var listName = match[2];
        var $parent = $element.parent();
        var $clone = $element.remove().clone();

        // console.log("ng-repeat", iterator, listName);

        var childScopes = [];

        var update = function ( items ) {
          var i, j;
          // console.log("update ng-repeat", listName, items);

          for ( i = 0, j = childScopes.length; i < j; i++ ) {
            childScopes[i].$destroy();
          }
          childScopes = [];

          $parent.children().off().remove();

          var item, $child;

          if ( isArray(items) ) {
            for ( i = 0, j = items.length; i < j; i++ ) {
              item = items[i];
              $child = $clone.clone().appendTo($parent);

              var childScope = scope.$new();
              childScope[iterator] = item;

              // console.log("child", childScope);

              childScopes.push(childScope);

              compile(scope.$app, childScope, $child[0]);
            }
          }
          // } else if ( isPlainObject(items) ) {
          //   for ( var key in items ) {
          //     item = items[key];
          //   }
          // }
        };

        scope.$watch(listName, update);
      }

      return true;
    }
  };

  /**
  * Default filters
  */

  defaultFilters["currency"] = function ( input ) {
    return "$" + input;
  };

  /**
  * Core
  */

  function compile ( app, scope, element ) {
    var i, j, node;

    if ( element.hasChildNodes() ) {
      // var childNodes = element.childNodes;
      // console.log("A", childNodes.length);

      // Copy nodes into array as directives might manipulate DOM.
      var childNodes = [];
      for ( i = 0, j = element.childNodes.length; i < j; i++ ) {
        childNodes.push(element.childNodes[i]);
      }

      for ( i = 0, j = childNodes.length; i < j; i++ ) {
        node = childNodes[i];

        var nodeType = node.nodeType;

        if ( nodeType === ELEMENT_NODE ) {
          var preventCompile = compileAttributes(app, scope, node, node.attributes);
          if ( !preventCompile ) {
            compile(app, scope, node);
          }
        }
        else if ( nodeType === TEXT_NODE ) {
          // console.log("text", node);
          // console.log("text", node.nodeValue);
          interpolateFn(node, scope);
        }
      }
    }
  }

  function compileAttributes ( app, scope, element, attrs ) {
    var i, j, attr;

    var $element = $(element);
    var preventCompile = false;

    for ( i = 0, j = attrs.length; i < j; i++ ) {
      attr = attrs[i];
      // console.log("attr", attr);

      var directive = app.directives[attr.name];
      if ( directive ) {
        if ( directive.link(scope, $element, attrs) ) {
          preventCompile = true;
        }
      }
    }

    return preventCompile;
  }

  var interpolateRegExp = /\{\{\s*([\w\.]+)\s*(?:|(.*))?\}\}/g;

  function interpolateFn ( textNode, scope ) {
    var text = textNode.nodeValue;

    var update = function ( newValue, oldValue ) {
      textNode.nodeValue = text.replace(interpolateRegExp, function ( line, prop, filters ) {
        var result = scope.$eval(prop) || "";

        if ( filters ) {
          buildFilterExpr(filters);
        }

        if ( typeof result === "object" ) {
          result = JSON.stringify(result);
        }
        return result;
      });
    };

    update();

    text.replace(interpolateRegExp, function ( line, prop ) {
      scope.$watch(prop, update);
    });
  }

  var filterRegExp = /([a-z_$]+[a-z0-9_$])(?:\s*:\s*(.+))?/i;
  var filterArgsRegExp = /([^:\s]+)/;

  function buildFilterExpr ( filterStr ) {
    var filters = filterStr.split("|");
    var buffer = "";

    var stack = [];

    for ( var i = filters.length - 1; i >= 0; i-- ) {
      var filterMatch = filters[i].match(filterRegExp);
      if ( filterMatch ) {
        console.log(filterMatch);
        buffer += "filter('" + filterMatch[1] + "')(";
        if ( filterMatch[2] ) {
          filterMatch[2].replace(filterArgsRegExp, function ( line, arg ) {
            console.log(arg);
          });
        }
      }
    }

    buffer += "input)";
    console.log(buffer);
  }

  return acute;
}));
