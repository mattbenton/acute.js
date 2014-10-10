// TODO: Allow object literals inside here.
// Will probably have to be a function to parse them.
// Can still use this to detect interpolation tags though.

var parse = require("./parser").parse;

var interpolateRegExp = /\{\s*([^}]+)\s*\}/;
var interpolateRegExpGlobal = /\{\s*([^}]+)\s*\}/g;

exports.Interpolation = Interpolation;

function Interpolation ( textOrNode, scope ) {
  this.scope = scope;

  var node, text;
  if ( typeof textOrNode === "string" ) {
    text = textOrNode;
  } else {
    this.node = node = textOrNode;
    text = node.nodeValue;
  }

  var watchedPaths = this.watchedPaths = {};
  this.subPaths = {};

  interpolateRegExpGlobal.lastIndex = 0;
  var parts = this.parts = [];
  var index = 0;
  var match;

  while ( (match = interpolateRegExpGlobal.exec(text)) !== null ) {
    var raw = match[0];
    var source = match[1];

    var leftStr = text.substr(index, match.index - index);
    if ( leftStr ) {
      parts.push(leftStr);
    }

    var evalFn = parse(source);
    if ( evalFn ) {
      for ( var i = 0, len = evalFn.watches.length; i < len; i++ ) {
        watchedPaths[evalFn.watches[i]] = true;
      }
    }

    parts.push(evalFn);
    index = match.index + raw.length;
  }

  // Last part of text.
  if ( index < text.length ) {
    parts.push(text.substr(index));
  }

  scope.watch(watchedPaths, { context: this, init: false }, this.onChange);

  this.onChange();
}

Interpolation.prototype.onChange = function () {
  var currentPaths = {};

  var output = "";
  var parts = this.parts;
  for ( var i = 0, len = parts.length; i < len; i++ ) {
    var obj = parts[i];
    if ( typeof obj === "string" ) {
      output += obj;
    } else {
      output += obj(this.scope, currentPaths);
    }
  }

  if ( this.node ) {
    this.node.nodeValue = output;
  }

  var subPaths = this.subPaths;

  // Add new paths.
  for ( var path in currentPaths ) {
    if ( !subPaths[path] ) {
      subPaths[path] = this.scope.watch(path, { context: this, init: false }, this.onChange);
    }
  }

  // Remove old paths.
  for ( path in subPaths ) {
    if ( !currentPaths[path] ) {
      this.scope.unwatch(subPaths[path]);
      delete subPaths[path];
    }
  }
};

exports.interpolate = function ( textOrNode, scope ) {
  var text = (typeof textOrNode === "string") ? textOrNode : textOrNode.nodeValue;
  if ( interpolateRegExp.test(text) ) {
    return new Interpolation(textOrNode, scope);
  }
};
