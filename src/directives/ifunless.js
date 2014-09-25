/**
* Default directives
*/

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

  var evalFn = this.evalFn = acute.parser.parse(expr);
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

acute.directives["if"] = (function () {

  function IfDirective ( element, expr, scope ) {
    this.inner = new IfUnlessDirective(element, expr, scope, "if", true);
  }

  IfDirective.bind = function ( element, attrValue, attrs, scope ) {
    new IfDirective(element, attrValue, scope);
  };

  IfDirective.unbind = function () {
  };

  return IfDirective;

}());

acute.directives.unless = (function () {

  function UnlessDirective ( element, expr, scope ) {
    this.inner = new IfUnlessDirective(element, expr, scope, "unless", false);
  }

  UnlessDirective.bind = function ( element, attrValue, attrs, scope ) {
    new UnlessDirective(element, attrValue, scope);
  };

  UnlessDirective.unbind = function () {
  };

  return UnlessDirective;

}());
