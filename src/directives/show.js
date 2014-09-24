/**
* Default directives
*/

acute.directives.show = (function () {

  var directive = {};
  directive.bind = function ( element, attrValue, attrs, scope ) {
    var evalFn = acute.parser.parse(attrValue);
    if ( evalFn.watches ) {
      var updateFn = function () {
        var result = evalFn(scope);
        $(element).toggleClass("ac-hide", !!!result);
      };
      scope.watch(evalFn.watches, updateFn);
    }
  };

  directive.unbind = function () {
  };

  return directive;

}());
