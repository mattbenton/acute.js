/**
* Parser
*
* TODO: cache constant values as return type
*/

acute.parser = (function () {

  var tests = [
    {
      input: "true",
      expect: "true"
    },
    {
      input: "2 + 3",
      expect: "2 + 3"
    },
    {
      input: "{ name: 'Matt' }",
      expect: "{ name: 'Matt' }"
    },
    {
      input: "name",
      expect: "get('name')"
    },
    {
      input: "   name  ",
      expect: "get('name')"
    },
    {
      input: "name = 2",
      expect: "set('name', 2)"
    },
    {
      input: "name = true",
      expect: "set('name', true)"
    },
    {
      input: "name = new Date",
      expect: "set('name', new Date)"
    },
    {
      input: "name = user.name",
      expect: "set('name', get('user.name'))"
    },
    {
      input: "user = { name: 'Matt' }",
      expect: "set('user', { name: 'Matt' })"
    },
    {
      input: "user = { 'name': 'Matt' }",
      expect: "set('user', { 'name': 'Matt' })"
    },
    {
      input: "user = { name: 'Matt', age: 27 }",
      expect: "set('user', { name: 'Matt', age: 27 })"
    },
    {
      input: "user = { name: 'Matt', age: 27, gf: { name: 'Decca', age: 24 } }",
      expect: "set('user', { name: 'Matt', age: 27, gf: { name: 'Decca', age: 24 } })"
    },
    {
      input: "user = getUser(auth.name)",
      expect: "set('user', exec('getUser', get('auth.name')))"
    },
    {
      input: "user = getUser(auth.getName())",
      expect: "set('user', exec('getUser', exec('auth.getName')())"
    }
  ];

  var reservedWordPattern = /^true|false|null|undefined|new|Date$/;
  var identifierPattern = /^[$a-zA-Z_]+[$a-zA-Z_0-9.]*$/;

  var STACK_OBJECT = 1;

  function parse ( input, maxLength, callback ) {
    var index = 0;
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

    function getDebugInfo () {
      return {
        index: index,
        chr: chr,
        isEscaped: isEscaped,
        inString: inString,
        quoteChr: quoteChr
      };
    }

    while ( index < length ) {
      chr = input.charAt(index);
      index++;

      if ( chr === "{" ) {
        buffer += chr;
        stack.push(STACK_OBJECT);
      }
      else if ( chr === "\\" ) {
        isEscaped = !isEscaped;
      }
      else if ( chr === "'" || chr === '"' ) {
        if ( inString ) {
          if ( !isEscaped ) {
            inString = false;
            quoteChr = null;
          }
        } else {
          if ( !isEscaped ) {
            inString = true;
            quoteChr = chr;
          }
        }
        buffer += chr;
      }

      buffer += chr;

      if ( callback ) {
        callback(getDebugInfo());
      }
    }
  }

  return parser;
}());
