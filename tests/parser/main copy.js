var input = "   user.name = true, age = 4";
var index = 0;
var length = input.length;
var output = "";

/*



*/

var groups = {};

var objectStartRegExp = /\s*\{\s*/;
var objectEndRegExp = /\s*\}\s*/;
var objectPropRegExp = /[a-zA-Z$_]+[a-zA-Z0-9$_]*/;
var objectColonRegExp = /\s*:\s*/;

groups["object"] = {
  name: "object",
  structure: [
    objectStartRegExp,
    or(ref("string"), objectPropRegExp),
    objectColonRegExp
  ]
};

var refCache = {};
function ref ( name ) {
  var inst = refCache[name];
  if ( !inst ) {
    inst = refCache[name] = {
      ref: name,
      resolve: function () {
        return groups[name];
      }
    };
  }
  return inst;
}

function or () {
  return {
    or: Array.prototype.slice.call(arguments)
  };
}

console.log('input = "' + input + '"');

function slurp ( pattern ) {
  console.debug('slurp from "%s"', input.substr(index), pattern, input.charAt(index));
  var idx = index;
  var buffer = input.charAt(idx);
  if ( pattern.test(buffer) ) {
    var chr = input.charAt(++idx);
    while ( idx < length && pattern.test(buffer + chr) ) {
      buffer += chr;
      chr = input.charAt(++idx);
    }
    console.debug('buffer broke = "' + buffer + '"', idx);
    var result = {
      buffer: buffer,
      start: index,
      end: idx,
      chr: chr
    };
    index = idx;
    return result;
  }
  return null;
}

function slurp2 ( pattern ) {
  console.debug('slurp2 from %d being "%s"', index, input.substr(index), pattern, input.charAt(index));
  pattern.lastIndex = index;
  var match = pattern.exec(input);
  if ( match ) {
    var str = match[0];
    if ( (pattern.lastIndex - str.length) === index ) {
      var result = {
        buffer: str,
        start: index,
        end: pattern.lastIndex
      };
      index = pattern.lastIndex;
      return result;
    } else {
      console.log("matched at nope");
    }
  }
  return null;
}

function slurpString () {
  console.log('slurpString "%s"', input.substr(index));
  var chr = input.charAt(index);
  if ( chr === "'" || chr === '"' ) {
    var buffer = chr;
    var quote = chr;
    var isEscaped = false;
    while ( index < length ) {
      chr = input.charAt(++index);
      if ( chr === "\\" ) {
        isEscaped = !isEscaped;
      } else if ( chr === quote ) {
        if ( isEscaped ) {
          isEscaped = false;
        } else {
          return buffer + chr;
        }
      }
      buffer += chr;
    }
  }
  return null;
}

function eatWhitespace () {
  slurp(/^\s+$/);
}

function slurpProp () {
  return slurp(/^[a-zA-Z$_]+[a-zA-Z0-9$_.]*$/);
}

var propRegExp = /^[a-zA-Z$_]+[a-zA-Z0-9$_.]*$/;
var reservedRegExp = /^true|false|null|undefined|new|Date$/;
var equalsRegExp = /^=+$/;
var literalRegExp = /(["'])[^]*?\1/g;

var isSet = false;

parse();

function parse () {
  var chr, match;

  if ( index >= length ) {
    return;
  }

  eatWhitespace();
  var prop = slurp(propRegExp);
  if ( prop ) {
    if ( reservedRegExp.test(prop.buffer) ) {
      output += prop.buffer;
    } else {
      console.log("prop", prop);
      eatWhitespace();

      // Assignment or compare
      if ( (match = slurp(equalsRegExp)) ) {
        if ( match.buffer.length === 1 ) {
          isSet = true;
          console.log("assign");
          output += "set('" + prop.buffer + "', ";
          eatWhitespace();
        } else {
          console.log("compare");
          outputProp(prop);
          output += match.buffer;
        }
        return parse();
      }

      outputProp(prop);
      // return parse();
    }
  } else {
    console.log("#", input.substr(index));
    var str = slurpString();
    console.log("str", str);
    if ( str ) {
      output += str;
    }
    // var literal = slurp2(literalRegExp);
    // if ( literal ) {
    //   output += literal.buffer;
    // }
    // chr = input.charAt(index);
    // output += chr;
  }

  if ( isSet ) {
    output += ")";
  }
}

function outputProp ( slurped ) {
  output += "get('" + slurped.buffer + "')";
}

console.log('output = "%s"', output);
