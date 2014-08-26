/**
* Helpers
*/

var acute = acute || {};

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

acute.clone = clone;
function clone ( obj, isDeep ) {
  var result;
  if ( isPlainObject(obj) ) {
    result = {};
    for ( var prop in obj ) {
      if ( isDeep ) {
        result[prop] = clone(obj[prop], true);
      } else {
        result[prop] = obj[prop];
      }
    }
    return result;
  } else if ( isArray(obj) ) {
    result = [];
    for ( var i = 0, j = obj.length; i < j; i++ ) {
      if ( isDeep ) {
        result[i] = clone(obj[i], true);
      } else {
        result[i] = obj[i];
      }
    }
    return result;
  } else {
    return obj;
  }
}

acute.each = each;
function each ( obj, context, iterator ) {
  if ( isPlainObject(obj) ) {
    for ( var prop in obj ) {
      iterator.call(context, prop, obj[prop]);
    }
  } else if ( isArray(obj) ) {
    for ( var i = 0, j = obj.length; i < j; i++ ) {
      iterator.call(context, i, obj[i]);
    }
  }
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
