(function ( factory ) {
  if ( typeof define !== "undefined" && define.amd ) {
    define(factory);
  } else {
    window.acute = factory();
  }
}(function () {
  var acute = {};
