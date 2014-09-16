/* global acutePrefix */

/**
* Default directives
*/

acute.directives.click = (function () {

  var directive = {};
  directive.bind = function ( element, attr, scope ) {
    var expr = attr.value || attr.nodeValue;
    acute.trace.d("bind click", expr);

    var el = $(element);
    el.on("click", function () {
      var expr = el.attr(acutePrefix + "click");
      if ( expr ) {
        scope.$eval(expr);
      }
      return false;
    });
  };

  directive.unbind = function ( element ) {

  };

  return directive;

}());
