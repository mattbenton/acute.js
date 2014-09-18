/**
* Parser
*
* @constructor
*/
function Parser () {

}

/**
* Parses an input string.
*
* @param {String} input The input string.
* @return {String} The transformed expression.
*/
Parser.prototype.parse = function ( input ) {
  this.reset();

  this.input = input;
  this.length = input.length;
};

/**
* Resets the internal state of the parser.
*/
Parser.prototype.reset = function () {
  this.index = 0;
  this.output = "";
};

/**
* Consumes one character of **input** at a time into a buffer and repeats
* until the buffer no longer matches the pattern.
*
* The pattern should
*
* @param {String|RegExp} pattern The pattern to continually test the buffer with. If `pattern` is a string,
* it is converted to a regular expression using x.
*
* @returns {String} The buffer. Will be empty if nothing was slurped.
*/
Parser.prototype.slurp = function ( pattern ) {
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
};
