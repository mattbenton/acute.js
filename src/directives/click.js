/**
* Default directives
*/

acute.directives.click = (function () {

  var directive = {};
  directive.bind = function ( element, attrValue, attrs, scope ) {
    var el = $(element);
    el.on("click", function () {
      if ( attrValue ) {
        scope.$eval(attrValue);
      }
      return false;
    });
  };

  directive.unbind = function () {

  };

  return directive;

}());
