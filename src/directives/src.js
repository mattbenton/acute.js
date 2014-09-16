/* global acutePrefix */

/**
* Default directives
*/

acute.directives.src = (function () {

  var directive = {};

  directive.bind = function ( element, attr, scope ) {
    var expr = attr.value || attr.nodeValue;
    var evalFn = acute.parser.parse(expr);
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
