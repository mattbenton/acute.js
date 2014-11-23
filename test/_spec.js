var acute = require("../src/acute");
var _ = require("lodash");

var lodashMethods = [
  // Arrays
  "indexOf",

  // Collections
  "contains",
  "each",
  "filter",
  "find",
  "forEach",
  "map",

  // Functions
  "bind",
  "debounce",
  "defer",
  "delay",
  "throttle",

  // Objects
  "clone",
  "cloneDeep",
  "isArray",
  "isFunction",
  "isPlainObject",
  "keys",
  "merge"
];

for ( var i = 0; i < lodashMethods.length; i++ ) {
  var method = lodashMethods[i];
  acute[method] = _[method];
}
