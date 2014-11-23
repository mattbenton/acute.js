/**
* Scope
*/

/* jshint evil: true */

var acute = require("./acute");
var Observer = require("./observer").Observer;
var parse = require("./parser").parse;

function Scope ( context ) {
  Observer.call(this, context);
  Scope.all.push(this);
}

var inDigest = false;
var allScopes = Scope.all = [];

Scope.digestAll = function () {
  if ( inDigest ) {
    acute.error("already in main digest!");
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

Scope.prototype = new Observer();
Scope.prototype.constructor = Scope;

Scope.prototype.$eval = function ( expr, resultFn ) {
  var evalFn = parse(expr);
  var result = evalFn(this);
  if ( resultFn ) {
    resultFn(result);
  }
  Scope.digestAll();
  return result;
};

Scope.prototype.exec = function ( path ) {
  var args = Array.prototype.slice.call(arguments, 1);
  var fn = this.get(path);
  if ( fn && acute.isFunction(fn) ) {
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

      var pipe = acute.pipes[name];
      if ( pipe ) {
        value = pipe.format(value, args, this, pathObj);
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

exports.Scope = Scope;
