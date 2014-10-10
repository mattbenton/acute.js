/*jshint sub:true */

var ifunless = require("./directives/ifunless");
var parse = require("./parser").parse;

// Default directives
var directives =  exports.directives = {
  "class":  require("./directives/class"),
  "click":  require("./directives/click"),
  "html":   require("./directives/html"),
  "if":     ifunless["if"],
  "unless": ifunless["unless"],
  "repeat": require("./directives/repeat"),
  "show":   require("./directives/show"),
  "value":  require("./directives/value")
};

var acutePrefix = "ac-";

exports.bind = function bindDirectives ( node, scope ) {
  var attrs = normalizeAttributes(node.attributes);

  var preventFutherBinding = false;

  for ( var name in attrs ) {
    var attrValue = attrs[name];

    if ( name.indexOf(acutePrefix) === 0 ) {
      name = name.replace(acutePrefix, "");

      var directive = directives[name];
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
};

function bindGenericAttribute ( node, attrName, attrValue, scope ) {
  var evalFn = parse(attrValue);
  /*jshint unused:false */
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
