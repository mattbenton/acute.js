/* global acutePrefix */

/**
* Default directives
*/

acute.directives.html = (function () {

  var directive = {};

  directive.bind = function ( element, attrValue, attrs, scope ) {
    var $el = $(element);
    var evalFn = acute.parser.parse(attrValue);
    scope.watch(evalFn.watches, function ( change ) {
      if ( change.value ) {
        $el.html(evalFn(scope, acute.format));
      } else {
        $el.html('');
      }
    });
  };

  directive.unbind = function ( element ) {
  };

  return directive;

}());
