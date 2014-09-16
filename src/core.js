/* jshint evil: true */

/**
* Directives
*/

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

/**
* Text node interpolation
*/

// var interpolateRegExp = /\{\s*([\w\.]+)\s*(?:|(.*))?\}/g;
var interpolateRegExp = /\{\s*([a-z0-9\._]+)\s*\}/ig;

function interpolateTextNode ( node, scope ) {
  var text = node.nodeValue;

  var watch = {};
  var watchCount = 0;

  var source = ('return "' + text.replace(interpolateRegExp, function ( line, path, filters ) {
    watch[path] = true;
    watchCount++;
    acute.trace.i("path", path, line);
    return '" + scope.get("' + path + '") + "';
  }) + '"').replace(/[\r\n]/g, "\\n");

  if ( watchCount ) {
    acute.trace.i(source);

    var replaceFn = new Function("scope", source);

    var updateFn = function ( change ) {
      acute.trace.i("updateFn!", change);
      if ( node ) {
        node.nodeValue = replaceFn(scope);
        // node.nodeValue = replaceFn(adaptor.read, model);
        // node.nodeValue = replaceFn(read, model);
      }
    };

    for ( var path in watch ) {
      // adaptor.subscribe(model, path, updateFn);
      // acute.log("watch", path);

      scope.watch(path, updateFn);

      // sightglass(model, path, updateFn);
    }

    updateFn();
  }
}
