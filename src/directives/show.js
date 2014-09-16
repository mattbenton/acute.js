/* global acutePrefix */

/**
* Default directives
*/

acute.directives.show = (function () {

  var directive = {};
  directive.bind = function ( element, attr, scope ) {
    var expr = attr.value || attr.nodeValue;

    var evalFn = acute.parser.parse(expr);
    if ( evalFn.watches ) {
      var updateFn = function ( change ) {
        var result = evalFn(scope);

        $(element).toggleClass("ac-hide", !!!result);
      };
      scope.watch(evalFn.watches, updateFn);
    }
  };

  directive.unbind = function ( element ) {
  };

  return directive;

}());
