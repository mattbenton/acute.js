/**
* Scope
*/

var scopeChildListAccessor = new LinkedListAccessor("$childHead", "$childTail", "$prevSibling", "$nextSibling");

function Scope () {
  this.$id = nextUid();
  this.$watcher = new Watcher().poll(100);

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
