/* jshint evil:true */

acute.formatters.eval = (function () {
  var interpolateRegExp = /\{\s*([^}]+)\s*\}/;
  var interpolateRegExpGlobal = /\{\s*([^}]+)\s*\}/g;

  var formatter = {
    format: function ( value, scope, pathObj ) {
      if ( interpolateRegExp.test(value) ) {
        return value.replace(interpolateRegExpGlobal, function ( line, source ) {
          var evalFn = acute.parser.parse(source);
          if ( pathObj ) {
            for ( var i = 0, len = evalFn.watches.length; i < len; i++ ) {
              pathObj[evalFn.watches[i]] = true;
            }
          }
          return evalFn(scope, pathObj);
        });
      }
      return value;
    }
  };

  return formatter;
}());
