var parse = require("../parser").parse;

exports.bind = function ( element, attrValue, attrs, scope ) {
  var evalFn = parse(attrValue);
  var $el = $(element);
  scope.watch(evalFn.watches, function () {
    var classes = evalFn(scope);
    for ( var klass in classes ) {
      $el.toggleClass(klass, Boolean(classes[klass]));
    }
  });
};

exports.unbind = function () {
};
