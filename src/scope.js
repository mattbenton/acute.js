/**
* Scope
*/

/* jshint evil: true */
/* exported Scope */
var Scope = acute.Scope = (function () {

  var allScopes = acute.allScopes = [];

  var inDigest = false;
  acute.digest = function () {
    if ( inDigest ) {
      throw new Error("[acute] already in main digest!");
    } else {
      try {
        inDigest = true;
        for ( var i = 0, len = allScopes.length; i < len; i++ ) {
          var scope = allScopes[i];
          if ( scope && !scope.destroyed ) {
            scope.digest();
          }
        }
        inDigest = false;
      } catch ( err ) {
        acute.error("digest error", err);
      }
    }
  };

  function Scope ( context ) {
    Observer.call(this, context);
    allScopes.push(this);
  }

  Scope.prototype = new Observer();
  Scope.prototype.constructor = Scope;

  Scope.prototype.$eval = function ( expr, resultFn ) {
    var evalFn = acute.parser.parse(expr);
    var result = evalFn(this, acute.format);
    if ( resultFn ) {
      resultFn(result);
    }
    // this.digest();
    acute.digest();
    return result;
  };

  Scope.prototype.exec = function ( path ) {
    var args = Array.prototype.slice.call(arguments, 1);
    var fn = this.get(path);
    if ( fn && _.isFunction(fn) ) {
      var contextPath = getPreviousPathSegment(path);
      if ( contextPath ) {
        var context = this.get(contextPath);
        return fn.apply(context, args);
      }
      return fn.apply(null, args);
    }
  };

  function getPreviousPathSegment ( path ) {
    var a = path.lastIndexOf(".");
    var b = path.lastIndexOf("[");
    var lastIndex = a > b ? a : b;
    if ( lastIndex > 0 ) {
      return path.substr(0, lastIndex);
    }
  }

  Scope.prototype.pipe = function ( pipes, value, pathObj ) {
    if ( pipes.length ) {
      for ( var i = 0, len = pipes.length; i < len; i++ ) {
        var item = pipes[i];
        var name = item[0];
        var args = item[1];

        var fmt = acute.formatters[name];
        if ( fmt ) {
          value = fmt.format(value, args, this, pathObj);
        } else {
          acute.trace.f("no ", name);
        }
      }
    }
    return value;
  };

  Scope.prototype.clone = function ( locals ) {
    var clone = new Scope(this.context);
    if ( locals ) {
      clone.locals = locals;
    }
    return clone;
  };

  Scope.prototype.destroy = function () {
    this.destroyed = true;
    Observer.prototype.destroy.call(this);
    for ( var index = 0, len = allScopes.length; index < len; index++ ) {
      if ( allScopes[index] === this ) {
        allScopes.splice(index, 1);
      }
    }
  };

  return Scope;
}());
