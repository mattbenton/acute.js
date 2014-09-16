var ELEMENT_NODE = 1;
var ATTRIBUTE_NODE = 2;
var TEXT_NODE = 3;
var COMMENT_NODE = 8;

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

acute.view = function ( element, model ) {
  if ( element ) {
    var view = new View(element, model);
    return view;
  }
};

function bindView ( view, element, scope ) {
  var inDebug = false;

  // console.warn("bind", element);

  var preventFutherBinding = bindDirectives(element, scope);

  if ( element.hasChildNodes() ) {
    if ( preventFutherBinding ) {
      return true;
    }

    var node = element.firstChild;
    while ( node ) {
      var nodeType = node.nodeType;

      if ( nodeType === ELEMENT_NODE ) {
        bindView(view, node, scope);
        // preventFutherBinding = bindView(view, node, scope);
        // if ( preventFutherBinding ) {
        //   break;
        // }
      }
      else if ( nodeType === TEXT_NODE ) {
        interpolateTextNode(node, scope);
      }

      node = node.nextSibling;
    }
  }

  return false;
}
