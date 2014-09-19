/**
* Default directives
*/

acute.directives = {};

var acutePrefix = "ac-";

function bindDirectives ( node, scope ) {
  var attrs = normalizeAttributes(node.attributes);

  var preventFutherBinding = false;

  for ( var name in attrs ) {
    var attrValue = attrs[name];

    if ( name.indexOf(acutePrefix) === 0 ) {
      name = name.replace(acutePrefix, "");

      var directive = acute.directives[name];
      if ( directive ) {

        directive.bind(node, attrValue, attrs, scope);
        if ( directive.stop ) {
          preventFutherBinding = true;
        }
      } else {
        console.log("here!", name);
      }
    }
  }

  return preventFutherBinding;
}

function normalizeAttributes ( attributes ) {
  var attrs = {};
  for ( var i = 0, len = attributes.length; i < len; i++ ) {
    var attr = attributes[i];
    attrs[attr.name] = attr.value || attr.nodeValue;
  }
  return attrs;
}
