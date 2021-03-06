/* jshint evil:true */

var acute = require("../acute");

var interpolateRegExp = /\{\s*([^}]+)\s*\}/;
var interpolateRegExpGlobal = /\{\s*([^}]+)\s*\}/g;

exports.format = function ( value, options, scope, pathObj ) {
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
};
