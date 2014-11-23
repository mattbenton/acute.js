(function ( factory ) {
  if ( typeof fanplayr !== "undefined" && fanplayr.define ) {
    fanplayr.define("acute", factory);
  }
  else if ( typeof define !== "undefined" && define.amd ) {
    define(factory);
  }
  else {
    this.acute = factory();
  }
})(function () {
  var acute = require("./acute");

  acute.log         = require("./log");
  acute.dom         = require("./dom");
  acute.parser      = require("./parser");
  acute.interpolate = require("./interpolation").interpolate;
  acute.pipes       = require("./pipes").pipes;
  acute.directives  = require("./directives").directives;
  acute.Scope       = require("./scope").Scope;
  acute.digest      = acute.Scope.digestAll;
  acute.view        = require("./view").create;

  return acute;
});
