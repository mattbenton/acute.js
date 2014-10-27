var root = window;

// Hook up JSON.
var _JSON = root.JSON || root.JSON3 || root.JSON2;

var acute = module.exports = {
  configure: function ( options ) {
    var value = options.$ || options.jQuery;
    if ( value ) {
      acute.element = value;
    }

    value = options._ || options.lodash;
    if ( value ) {
      hookLoDash(value);
    }

    value = options.json || options.JSON;
    if ( value ) {
      _JSON = value;
    }
  },

  error: error,

  element: function () {
    error("jQuery is not defined");
  },

  toJson: function ( value, replacer, space ) {
    if ( !_JSON ) {
      error("JSON is not defined");
    }
    return _JSON.stringify(value, replacer, space);
  },

  fromJson: function ( text, reviver ) {
    if ( !_JSON ) {
      error("JSON is not defined");
    }
    return _JSON.parse(text, reviver);
  },

  getType: function ( value ) {
    if ( value === null ) {
      return "null";
    }
    var type = typeof value;
    if ( type === "object" ) {
      if ( acute.isPlainObject(value) ) { return "object"; }
      if ( acute.isArray(value) ) { return "array"; }
      return "complex";
    }
    return type;
  }
};

var lodashMethods = [
  // Arrays
  "indexOf",

  // Collections
  // "contains",
  "each",
  "filter",
  "find",
  // "forEach",
  "map",

  // Functions
  // "bind",
  "debounce",
  // "defer",
  // "delay",
  "throttle",

  // Objects
  // "clone",
  // "cloneDeep",
  "isArray",
  "isFunction",
  "isPlainObject",
  "keys",
  "merge"
];

// Hook up jQuery.
var jQuery = root.jQuery;
if ( jQuery ) {
  acute.element = jQuery;
}

function lodashNoop () {
  error("LoDash is not defined");
}

// Hook up LoDash.
function hookLoDash ( lodash ) {
  for ( var i = 0; i < lodashMethods.length; i++ ) {
    var method = lodashMethods[i];
    if ( lodash ) {
      if ( lodash.hasOwnProperty(method) ) {
        acute[method] = lodash[method];
      } else {
        error("LoDash missing method '" + method + "'");
      }
    } else {
      acute[method] = lodashNoop;
    }
  }
}

var lodash = root._;
if ( /function|object/.test(typeof lodash) && lodash.name === "lodash" ) {
  hookLoDash(lodash);
} else {
  hookLoDash();
}

function error ( message ) {
  throw new Error("[acute] " + message);
}
