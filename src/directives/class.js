/* global acutePrefix */

/**
* Default directives
*/

acute.directives["class"] = (function () {

  var directive = {};

  directive.bind = function ( element, attrValue, attrs, scope ) {
    var evalFn = acute.parser.parse(attrValue);
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
