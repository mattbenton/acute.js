/* jshint evil:true */

acute.pipes["if"] = (function () {

  var formatter = {
    format: function ( value, options ) {
      if ( value && options && options[0] ) {
        return value;
      }
      return "";
    }
  };

  return formatter;
}());
