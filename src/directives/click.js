exports.bind = function ( element, attrValue, attrs, scope ) {
  var el = $(element);
  el.on("click", function () {
    if ( attrValue ) {
      scope.$eval(attrValue);
    }
    return false;
  });
};

exports.unbind = function () {

};
