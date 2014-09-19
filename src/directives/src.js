/* global acutePrefix */

/**
* Default directives
*/

acute.directives.src = (function () {

  var directive = {};

  directive.bind = function ( element, attrValue, attrs, scope ) {
    var evalFn = acute.parser.parse(attrValue);
    var $el = $(element);
    scope.watch(evalFn.watches, function ( change ) {
      var src = evalFn(scope);
      $el.attr("src", src);
    });
  };

  directive.unbind = function ( element ) {
  };

  return directive;

}());
