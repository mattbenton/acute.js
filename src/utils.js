exports.getType = function ( value ) {
  if ( value === null ) {
    return "null";
  }

  var type = typeof value;
  if ( type === "object" ) {
    if ( _.isPlainObject(value) ) { return "object"; }
    if ( _.isArray(value) ) { return "array"; }
    return "complex";
  }
  return type;
};
