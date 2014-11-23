var acute = require("../acute");

exports.bind = function ( element, attrValue, attrs, scope ) {
  var evalFn = acute.parser.parse(attrValue);
  if ( evalFn.watches ) {
    var updateFn = function () {
      var result = evalFn(scope);
      acute.element(element).toggleClass("ac-hide", !Boolean(result));
    };
    scope.watch(evalFn.watches, updateFn);
  }
};

exports.unbind = function () {
};
