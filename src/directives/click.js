var acute = require("../acute");

exports.bind = function ( element, attrValue, attrs, scope ) {
  var el = acute.element(element);
  el.on("click", function () {
    if ( attrValue ) {
      scope.$eval(attrValue);
    }
    return false;
  });
};

exports.unbind = function () {
};
