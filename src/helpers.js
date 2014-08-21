/**
* Helpers
*/

var objectClass = "[object Object]";
var arrayClass = "[object Array]";
var functionClass = "[object Function]";
var toString = Object.prototype.toString;

acute.isPlainObject = isPlainObject;
function isPlainObject ( value ) {
  return value && typeof value == "object" && toString.call(value) == objectClass && !isArray(value);
}

acute.isArray = isArray;
function isArray ( value ) {
  return value && typeof value == "object" && typeof value.length == "number" &&
    toString.call(value) == arrayClass || false;
}

function isFunction ( value ) {
  return value && toString.call(value) == functionClass;
}

acute.extend = extend;
function extend ( target ) {
  var sources = Array.prototype.slice.call(arguments, 1);
  for ( var i = 0, j = sources.length; i < j; i++ ) {
    var source = sources[i];
    for ( var prop in source ) {
      target[prop] = source[prop];
    }
  }
  return target;
}

var UNIQUE_ID_COUNT = 0;
function nextUid () {
  return "$" + UNIQUE_ID_COUNT++;
}
