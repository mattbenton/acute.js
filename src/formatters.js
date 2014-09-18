acute.formatters = {};

acute.format = function ( list, value ) {
  if ( list.length ) {
    for ( var i = 0, len = list.length; i < len; i++ ) {
      var item = list[i];
      var name = item[0];
      var args = item[1];

      var fmt = acute.formatters[name];
      if ( fmt ) {
        console.log(name, fmt);
      } else {
        cosole.log("no ", name);
      }
    }
  }
  return value;
};
