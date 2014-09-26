// acute, $ and _ are defined in header of build.

var scope = require("./scope");

acute = {
  log:           require("./log"),
  dom:           require("./dom"),
  parser:        require("./parser"),
  interpolate:   require("./interpolation").interpolate,
  pipes:         require("./pipes").pipes,
  directives:    require("./directives").directives,
  Scope:         scope.Scope,
  digest:        scope.Scope.digestAll,
  view:          require("./view").create,
  utils:         require("./utils")
};

acute.configure = function ( options ) {
  var value = options.$ || options.jQuery;
  if ( value ) {
    $ = value;
  }

  value = options._ || options.lodash;
  if ( value ) {
    _ = value;
  }

  value = options.json || options.JSON;
  if ( value ) {
    acuteJson = value;
  }
};

acute.toJson = function ( value, replacer, space ) {
  if ( !acuteJson ) {
    throw new Error("[acute] JSON is not defined");
  }
  return acuteJson.stringify(value, replacer, space);
};

acute.fromJson = function ( text, reviver ) {
  if ( !acuteJson ) {
    throw new Error("[acute] JSON is not defined");
  }
  return acuteJson.parse(text, reviver);
};

function factory () {
  return acute;
}

if ( typeof define !== "undefined" && define.amd ) {
  define(factory);
} else if ( typeof fanplayr === "object" && fanplayr.define !== "undefined" && fanplayr.define.amd ) {
  fanplayr.define(factory);
} else {
  window.acute = acute;
}
