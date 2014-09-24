(function ( factory ) {
  if ( typeof define !== "undefined" && define.amd ) {
    define(factory);
  } else if ( typeof fanplayr === "object" && fanplayr.define !== "undefined" && fanplayr.define.amd ) {
    fanplayr.define(factory);
  } else {
    window.acute = factory();
  }
}(function () {
  var acute = {};
