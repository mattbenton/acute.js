/**
* Parser
*
* TODO: cache constant values as return type
*/

var parse = (function () {

  var reservedWordPattern = /^true|false|null|undefined|new|Date$/;
  var identifierPattern = /^[$a-zA-Z_]+[$a-zA-Z_0-9.]*$/;

  var STACK_OBJECT = 1;

  // function Parser () {

  // }

  // Parser.prototype.slurp = function () {

  // }

  function parse ( input, maxLength, callback ) {
    var index = 0;
    // input += " ";
    var length = input.length;

    if ( maxLength ) {
      length = maxLength;
    }

    // Holds the character at the current index.
    var chr;

    // Whether or not a string is being escaped.
    var isEscaped = false;

    // True when an odd number of quotes have been found and not escaped.
    var inString = false;

    // The quote character when in a string.
    var quoteChr = null;

    var isProperty = false;
    var inSet = false;

    var buffer = "";
    var propBuffer = "";
    var stack = [];

    while ( index < length ) {

      var prop = slurp(identifierPattern);
      if ( prop ) {
        console.log(prop);
      } else {
        index++;
      }

      stack.push({
        index: index - 1,
        chr: chr,
        isEscaped: bool(isEscaped),
        inString: bool(inString),
        isProperty: bool(isProperty),
        quoteChr: quoteChr,
        propBuffer: propBuffer,
        buffer: buffer
      });
    }

    /**
    * Consumes one character of input at a time into a buffer and repeats
    * until the buffer no longer matches the pattern.
    *
    * @param {RegExp} pattern The pattern to test the buffer.
    * @returns {String} The buffer. Will be empty if nothing was slurped.
    */
    function slurp ( pattern ) {
      if ( pattern instanceof RegExp ) {
        var buffer = input.charAt(index - 1);
        // console.debug("slurp [%s], char: [%s]", buffer, input.charAt(index), index);
        while ( index < length && pattern.test(buffer) ) {
          // console.log("[%s]", buffer);
          buffer += input.charAt(index);
          index++;
        }
        chr = input.charAt(index - 1);
        return buffer;
      }
    }

    function bool ( value ) {
      if ( value ) {
        return '<span class="true">true</span>';
      }
      return '<span class="false">false</span>';
    }

    return stack;

    // return {
    //   index: index,
    //   chr: chr,
    //   isEscaped: isEscaped,
    //   inString: inString,
    //   quoteChr: quoteChr,
    //   buffer: buffer
    // };


  }

  return parse;
}());
