var parse = require("../parser").parse;

exports.bind = function ( element, attrValue, attrs, scope ) {
  var evalFn = parse(attrValue);
  if ( evalFn.watches ) {
    var updateFn = function () {
      var result = evalFn(scope);
      $(element).toggleClass("ac-hide", !Boolean(result));
    };
    scope.watch(evalFn.watches, updateFn);
  }
};

exports.unbind = function () {
};
