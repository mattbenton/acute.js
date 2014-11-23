var acute = require("../acute");

exports.bind = function ( element, attrValue, attrs, scope ) {
  var $el = acute.element(element);

  var lastViewValue;

  // console.debug("acute value", attrValue);
  var evalFn = acute.parser.parse(attrValue);
  scope.watch(evalFn.watches, function ( change ) {
    // console.debug("value", change);
    if ( change.value !== lastViewValue ) {
      $el.val(change.value);
    }
  });

  $el.on("change keyup", function () {
    var value = $el.val();
    if ( value !== lastViewValue ) {
      lastViewValue = value;
      scope.set(attrValue, value);
      acute.digest();
    }
  });
};

exports.unbind = function () {
};
