var acute = require("../acute");

exports.bind = function ( element, attrValue, attrs, scope ) {
  var evalFn = acute.parser.parse(attrValue);
  var $el = acute.element(element);
  scope.watch(evalFn.watches, function () {
    var classes = evalFn(scope);
    for ( var klass in classes ) {
      $el.toggleClass(klass, Boolean(classes[klass]));
    }
  });
};

exports.unbind = function () {
};
