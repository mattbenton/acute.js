var acute = require("../acute");

exports.bind = function ( element, attrValue, attrs, scope ) {
  var $el = acute.element(element);
  var evalFn = acute.parser.parse(attrValue);
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
