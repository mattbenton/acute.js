/* global acutePrefix */

/**
* Default directives
*/

acute.directives.html = (function () {

  var directive = {};

  directive.bind = function ( element, attr, scope ) {
    var expr = attr.value || attr.nodeValue;
    var $el = $(element);
    scope.watch(expr, function ( change ) {
      if ( change.value ) {
        $el.html(change.value);
      } else {
        $el.html('');
      }
    });
  };

  directive.unbind = function ( element ) {
  };

  return directive;

}());
