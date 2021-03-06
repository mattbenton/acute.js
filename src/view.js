var ELEMENT_NODE = 1;
var TEXT_NODE = 3;

var acute = require("./acute");
var Scope = require("./scope").Scope;
var bindDirectives = require("./directives").bind;

function View ( element, modelOrScope ) {
  this.element = element;

  if ( modelOrScope instanceof Scope ) {
    this.model = modelOrScope.context;
    this.scope = modelOrScope;
  } else {
    this.model = modelOrScope;
    this.scope = new Scope(modelOrScope);
  }

  bindView(this, element, this.scope);
}

View.prototype.destroy = function () {
  this.element = null;
  this.scope.destroy();
  this.scope = null;
  this.model = null;
};

function bindView ( view, element, scope ) {
  if ( bindDirectives(element, scope) ) {
    return;
  }

  if ( element.hasChildNodes() ) {
    var node = element.firstChild;
    while ( node ) {
      var nodeType = node.nodeType;

      // Get a reference to the next node before calling `bindView()`
      // as directives like `if` or `unless` may remove the node,
      // resulting in a broken chain.
      var nextSibling = node.nextSibling;

      if ( nodeType === ELEMENT_NODE ) {
        bindView(view, node, scope);
      }
      else if ( nodeType === TEXT_NODE ) {
        acute.interpolate(node, scope);
      }

      node = nextSibling;
    }
  }
}

exports.View = View;
exports.bind = bindView;

exports.create = function ( element, model ) {
  if ( element ) {
    var view = new View(element, model);
    return view;
  }
  acute.error("invalid element passed to view()");
};
