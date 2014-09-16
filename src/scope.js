/**
* Scope
*/

/* jshint evil: true */

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
    var result = evalFn(this);
    if ( resultFn ) {
      resultFn(result);
    }
    // this.digest();
    acute.digest();
    return result;
  };

  var noOp = function () {};
  Scope.prototype.exec = function ( path ) {
    var fn = this.get(path);
    if ( fn && isFunction(fn) ) {
      return fn;
    }
    return noOp;
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
