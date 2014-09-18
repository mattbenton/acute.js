var groups = {};

// var objectStartRegExp = /\s*\{\s*/g;
// var objectEndRegExp = /\s*\}\s*/g;
// var objectPropRegExp = /\s*((?:,\s*)?[a-zA-Z0-9$_\-'"]+)\s*/g;
// var objectColonRegExp = /\s*:\s*/g;

// var literalRegExp = /(\s*[\d.]+|true|false|null|undefined|new|Date\s*)/g;
// var propertyRegExp = /\s*([a-zA-Z_$]+[a-zA-Z0-9_$.]*)\s*/g;
// var operatorRegExp = /\s*(\+|-|==|===|\*|\/)\s*/g;
// var assignmentRegExp = /\s*=\s*/g;

var objectStartRegExp = /\s*\{\s*/g;
var objectEndRegExp = /\s*\}\s*/g;
var objectPropRegExp = /\s*((?:,\s*)?[a-zA-Z0-9$_\-'"]+)\s*/g;
var objectColonRegExp = /\s*:\s*/g;

var literalRegExp = /(\s*[\d.]+|true|false|null|undefined|new|Date\s*)/g;
var propertyRegExp = /\s*([a-zA-Z_$]+[a-zA-Z0-9_$.]*)\s*/g;
var operatorRegExp = /\s*(\+|-|==|===|\*|\/)\s*/g;
var assignmentRegExp = /\s*=\s*/g;

var refCache = {};
function ref ( name ) {
  var inst = refCache[name];
  if ( !inst ) {
    inst = refCache[name] = {
      type: "ref",
      name: name,
      resolve: function () {
        return groups[name];
      }
    };
  }
  return inst;
}

function Ref ( name ) {
  this.name = name;
  this.resolve = function () {
    return groups[name];
  };
}

function Or () {
  this.items = Array.prototype.slice.call(arguments);
}

function or () {
  return {
    type: "or",
    items: Array.prototype.slice.call(arguments)
  };
}

function createPattern ( pattern ) {
  return {
    type: "pattern",
    pattern: pattern
  };
}

// var input = "  {  name: fred }";
var input = " { name : fred, age: 'Matt'} ";
var index = 0;
var output = "";

var $M = [];

function match ( pattern ) {
  pattern.lastIndex = index;
  var result = pattern.exec(input);
  if ( result ) {
    var str = result[0];
    if ( (pattern.lastIndex - str.length) === index ) {
      console.log("match", pattern, $M, input.substr(index), true);
      $M = result.slice(1);
      index = pattern.lastIndex;
      return true;
    }
  }
  console.log("match", pattern, input.substr(index), false);
}

function expression () {
  console.log("expression");
  return object() || literal() || property();
}

function object () {
  console.log("object");
  if ( match(objectStartRegExp) ) {
    append("{ ");
    while ( objectProp() ) {}
    if ( match(objectEndRegExp) ) {
      append(" }");
      return true;
    }
    return true;
  }
}

function objectProp () {
  console.log("objectProp");
  if ( match(objectPropRegExp) ) {
    append($M[0]);
    if ( match(objectColonRegExp) ) {
      append(": ");
      if ( expression() ) {
        return true;
      }
    }
  }
}

function literal () {
  console.log("literal");
  if ( match(literalRegExp) ) {
    console.log("literal 2");
    append($M[0]);
    return true;
  }
}

function property () {
  console.log("property");
  if ( match(propertyRegExp) ) {
    var prop = $M[0];
    if ( operator() ) {
      append("get('" + prop + "')");
      return true;
    } else if ( assignment(prop) ) {
      // console.log("assign");
      // output += "set('" + prop + "', ";
      // expression();
      return true;
    } else {
      append("get('" + prop + "')");
      return true;
    }
  }
}

function append ( str ) {
  output += str;
  console.log('append: "%s", output: "%s"', str, output);
}

function operator () {
  console.log("operator");
  if ( match(operatorRegExp) ) {
    append($M[0]);
    return true;
  }
}

function assignment ( prop ) {
  if ( match(assignmentRegExp) ) {
    append("set('" + prop + "', ");
    expression();
    append(")");
    return true;
  }
}

// groups["object"] = {
//   name: "object",
//   structure: [
//     objectStartRegExp,
//     or(ref("string"), objectPropRegExp),
//     objectColonRegExp
//   ]
// };

console.debug(input);
expression();
console.debug(output);
