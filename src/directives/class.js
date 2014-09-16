/* global acutePrefix */

/**
* Default directives
*/

acute.directives["class"] = (function () {

  var directive = {};

  directive.bind = function ( element, attr, scope ) {
    var expr = attr.value || attr.nodeValue;
    var evalFn = acute.parser.parse(expr);
    var $el = $(element);
    scope.watch(evalFn.watches, function ( change ) {
      var classes = evalFn(scope);
      acute.trace.d("classes", classes);
      for ( var klass in classes ) {
        $el.toggleClass(klass, Boolean(classes[klass]));
      }
    });
  };

  directive.unbind = function ( element ) {
  };

  return directive;

}());
