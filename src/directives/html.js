var parse = require("../parser").parse;

exports.bind = function ( element, attrValue, attrs, scope ) {
  var $el = $(element);
  var evalFn = parse(attrValue);
  scope.watch(evalFn.watches, function ( change ) {
    if ( change.value ) {
      $el.html(evalFn(scope));
    } else {
      $el.html('');
    }
  });
};

exports.unbind = function () {
};
