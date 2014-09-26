var parse = require("../parser").parse;

/**
* Adds or removes an element from its position in the DOM
* based on the expression.
*
* A comment node is added before the element as a placeholder
* to maintain the insertion point.
*/
function IfUnlessDirective ( element, expr, scope, name, compareValue ) {
  this.scope = scope;

  this.inDom = true;

  this.$el = $(element);

  this.$placeholder = $(acute.dom.createCommentNode(element.ownerDocument, "ac-" + name + ": " + expr)).insertBefore(this.$el);

  // this.$placeholder = $("<!-- ac-" + name + ": " + expr + " -->").insertBefore(this.$el);
  this.compareValue = compareValue;

  var evalFn = this.evalFn = parse(expr);
  if ( evalFn.watches ) {
    scope.watch(evalFn.watches, { context: this }, this.update);
  }
}

IfUnlessDirective.prototype.update = function ( change ) {
  if ( Boolean(change.value) === this.compareValue ) {
    if ( !this.inDom ) {
      this.inDom = true;
      this.$el.insertAfter(this.$placeholder);
    }
  } else {
    if ( this.inDom ) {
      this.inDom = false;
      this.$el.remove();
    }
  }
};

exports["if"] = {
  bind: function ( element, attrValue, attrs, scope ) {
    new IfUnlessDirective(element, attrValue, scope, "if", true)
  },
  unbind: function () {

  }
};

exports["unless"] = {
  bind: function ( element, attrValue, attrs, scope ) {
    new IfUnlessDirective(element, attrValue, scope, "unless", false)
  },
  unbind: function () {

  }
};
