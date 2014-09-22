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
          // preventFutherBinding = true;
          return true;
        }
      } else {
        bindGenericAttribute(node, name, attrValue, scope);
      }
    }
  }

  return preventFutherBinding;
}

function bindGenericAttribute ( node, attrName, attrValue, scope ) {
  var evalFn = acute.parser.parse(attrValue);
  var unwatches = scope.watch(evalFn.watches, function ( change ) {
    if ( change.value ) {
      node.setAttribute(attrName, change.value);
    } else {
      node.removeAttribute(attrName);
    }
  });

  // TODO: Unbind
}

function normalizeAttributes ( attributes ) {
  var attrs = {};
  for ( var i = 0, len = attributes.length; i < len; i++ ) {
    var attr = attributes[i];
    attrs[attr.name] = attr.value || attr.nodeValue;
  }
  return attrs;
}
