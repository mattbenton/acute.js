/**
* Scope
*/

/* jshint evil: true */

var scopeChildListAccessor = new LinkedListAccessor("$childHead", "$childTail", "$prevSibling", "$nextSibling");

function Scope () {
  this.$id = nextUid();
  this.$watcher = new Watcher();

  this.$childHead = null;
  this.$childTail = null;
}

Scope.prototype.$watch = function ( prop, handler ) {
  // var evalFn = parseExpr(prop);
  // console.debug("evalFn", evalFn);
  // console.debug("scope watch", prop);
  this.$watcher.watch(this, prop, handler);
};

Scope.prototype.$digest = function () {
  var didChange = false;
  if ( this.$watcher.digest() ) {
    didChange = true;
  }

  var child = this.$childHead;
  while ( child !== null ) {
    if ( child.$digest() ) {
      didChange = true;
    }
    child = child.$nextSibling;
  }

  return didChange;
};

Scope.prototype.$eval = function ( expr ) {
  return parseExpr(expr)(this);
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
