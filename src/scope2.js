/* jshint unused:false */

var acute = require("./acute");

function Scope () {
  this.data = {};
  this.watchers = {};
}

Scope.prototype.get = function ( keypath ) {

};

Scope.prototype.set = function ( keypath, value ) {

};

Scope.prototype.exec = function ( keypath ) {

};

Scope.prototype.watch = function ( keypath ) {
  var watcher = this.watchers[keypath];
  if ( !watcher ) {
    watcher = this.watchers[keypath] = new Watcher(keypath);
  }
};

function Watcher ( keypath ) {
}

function flatten ( obj, context, keypath ) {
  if ( obj && typeof obj === "object" ) {
    if ( !context ) {
      context = {};
    }
    if ( !keypath ) {
      keypath = "";
    }
    acute.each(obj, function ( value, key ) {
      if ( typeof value === "object" ) {
        flatten(value, context, keypath + key + ".");
      } else {
        context[keypath + key] = value;
      }
    });
    return context;
  }
  return obj;
}

function expand ( obj ) {
  if ( obj && typeof obj === "object" ) {
    var context = {};
    acute.each(obj, function ( value, key ) {
      // console.log("key: '%s', value: '%s', context: ", key, value, context);
      expandPath(key.split("."), value, context);
    });
    return context;
  }
  return obj;
}

function expandPath ( keys, value, context ) {
  var key = keys.shift();
  if ( keys.length ) {
    context[key] = context[key] || {};
    expandPath(keys, value, context[key]);
  } else {
    context[key] = value;
  }
  return context;
}

module.exports = {
  flatten: flatten,
  expand: expand
};
