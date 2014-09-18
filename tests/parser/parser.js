

var reProperty = /^\s*([a-zA-Z$_]+[a-zA-Z0-9$_.]*)/;

function Buffer ( input ) {
  this.input = input;
  this.length = input.length;
  this.index = 0;
  this.output = "";
}

Buffer.prototype.write = function ( str ) {
  this.output += str;
  console.log("%cwrite: %s", "color: green;", str);
};

Buffer.prototype.match = function ( pattern ) {
  var index = this.index;
  pattern.lastIndex = index;
  var result = pattern.exec(this.input);
  if ( result ) {
    var str = result[0];
    if ( (pattern.lastIndex - str.length) === index ) {
      console.log("    match", pattern, $M, this.input.substr(index), true);
      // Assign matches.
      this.$ = result.slice(1);
      this.index = pattern.lastIndex;
      return true;
    }
  }
};

Buffer.prototype.getProperty = function () {
  if ( this.match(reProperty) ) {
    // return
  }
};

Buffer.prototype.peek = function ( arg ) {
  if ( !arg ) {
    error("peek() arg is falsy");
  }

  var index = this.index;
  if ( typeof arg === "string" ) {
    var len = arg.length;
    if ( len === 1 ) {
      return this.input.charAt(index) === arg;
    }
    return this.input.substr(index, arg.length) == arg;
  }
  return arg.test(this.input.substr(index));
};

Buffer.prototype.consume = function ( arg ) {
  if ( !arg ) {
    error("consume() arg is falsy");
  }

  var index = this.index;
  if ( typeof arg === "string" ) {
    var len = arg.length;
    if ( this.input.substr(index, len) === arg ) {
      this.index += len;
      return arg;
    }
    return null;
  }

  var input = this.input.substr(index);
  var match = input.match(arg);
  if ( match ) {
    this.index = match[1].length;
    return match;
  }
  return null;
};

/**
* Gets all text from the current index up until `closeChr` is found.
* This method balances `openChr` and `closeChr`, meaning that a valid
* match is only returned when there are an equal number of open and close
*
* @param {String|null} openChr The open character. Must be different from `closeChr`.
*        Can be `null` to specify no balancing.
*
* @param {String} closeChr The character to match up until.
*
* @param {String|null} escapeChr Matching will not end if this character directly
* preceeds `closeChr`.
*
* @returns {String|null} A string if matching succeeds or `null`.
*/
Buffer.prototype.getBetween = function ( openChr, closeChr, escapeChr ) {
  var openCount = 0;
  var buffer = "";

  var input = this.input;
  var length = this.length;
  var index = this.index;

  var startIndex = index;

  var chr = input.charAt(index);
  if ( openChr ) {
    if ( chr !== openChr ) {
      error("getBetween() does not start with openChr");
    }
    index++;
  }

  while ( index < length ) {
    chr = input.charAt(index);
    console.log(chr, buffer);
    if ( chr === openChr ) {
      openCount++;
    } else if ( chr === closeChr ) {
      if ( openCount ) {
        openCount--;
      } else if ( index === startIndex || input.charAt(index - 1) !== escapeChr ) {
        this.index = index + 1;
        return buffer;
      }
    }
    index++;
    buffer += chr;
  }

  console.warn("getBetween failed open: %s, close: %s, escapeChr: %s", openChr, closeChr, escapeChr);
  return null;
};

Buffer.prototype.readProperty = function () {
  var prop = this.consume(reProperty);
  if ( prop ) {
    console.log("matched property", prop[1]);
    if ( this.peek("(") ) {
      // Function invocation.
      console.log("function");
      var str = this.getBetween("(", ")");
      if ( str !== null ) {
        console.log(str);
        this.write("set('" + prop[1] + "', " + parse(str) + ")");
        return true;
      }
    }
    else if ( this.peek(/^\s*==/, true) ) {

    } else {
      this.write("get('" + prop[1] + "')");
    }
  }
};

function error ( message ) {
  throw new Error(message);
}

function parse ( input ) {
  var buffer = new Buffer(input);
  buffer.readProperty();
  if ( input && !buffer.output ) {
    error("Couldn't parse \"" + input + "\"");
  }
  return buffer.output;
}

function property ( buffer ) {
  var prop = buffer.consume(reProperty);
  if ( prop ) {
    console.log("matched property", prop[1]);
    if ( buffer.peek("(") ) {
      // Function invocation.
      console.log("function");
      var expr = buffer.getBetween("(", ")");
      if ( expr !== null ) {
        console.log(expr);
        buffer.write("set('" + prop[1] + "', " + parse(expr) + ")");
        return true;
      }
    }
    else if ( buffer.peek(/^\s*==/, true) ) {

    }
  }
}

/**
* Parser
* @constructor
*/
function Parser () {
}

/**
* Parses an input string.
*
* @function parse
* @param {String} input The input string.
* @return {String} The transformed expression.
*/
Parser.prototype.parse = function ( input ) {
};

/**
* Consumes one character of input at a time into a buffer and repeats
* until the buffer no longer matches the pattern.
*
* @function slurp
* @param {RegExp} pattern The pattern to test the buffer.
* @returns {String} The buffer. Will be empty if nothing was slurped.
*/
Parser.prototype.slurp = function ( pattern ) {
  var input = this.input;
  var index = this.index;
  var length = this.length;

  // Initialize the buffer with the character at the current index.
  var buffer = input.charAt(index);

  // Keep consuming characters into the buffer while it matches the pattern.
  var count = 0;
  while ( index < length && pattern.test(buffer) && count < 1000 ) {
    index++;
    buffer += input.charAt(index);
    count++;
  }

  if ( buffer && index < length ) {
    // The last character broke the match so remove it.
    buffer = buffer.substr(0, -1);
    index--;
  }

  this.index = index;

  return buffer;
};
