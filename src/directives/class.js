/* global acutePrefix */

/**
* Default directives
*/

acute.directives["class"] = (function () {

  var directive = {};

  directive.bind = function ( element, attr, scope ) {
    var expr = attr.value || attr.nodeValue;

    var evalFn = acute.parser.parse(expr);
    acute.trace.d("class", expr, evalFn);

    // var $el = $(element);
    // scope.watch(expr, function ( change ) {
    //   acute.trace.d("change class", change);
    //   // if ( change.value ) {
    //   //   $el.html(change.value);
    //   // } else {
    //   //   $el.html('');
    //   // }
    // });
  };

  directive.unbind = function ( element ) {
  };

  return directive;

}());
