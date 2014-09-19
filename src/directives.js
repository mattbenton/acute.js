/**
* Default directives
*/

acute.directives = {};

var acutePrefix = "ac-";

function bindDirectives ( node, scope ) {
  var attributes = node.attributes;

  var preventFutherBinding = false;

  for ( var i = 0, len = attributes.length; i < len; i++ ) {
    var attr = attributes[i];
    var name = attr.name;
    if ( name.indexOf(acutePrefix) === 0 ) {
      name = name.replace(acutePrefix, "");
      // acute.trace.d("attr", attr);
      var directive = acute.directives[name];
      if ( directive ) {
        directive.bind(node, attr, scope);
        if ( directive.stop ) {
          preventFutherBinding = true;
        }
      }
    }
  }

  return preventFutherBinding;
}
