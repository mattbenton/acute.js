/**
* Core
*/

var ELEMENT_NODE = 1;
var ATTRIBUTE_NODE = 2;
var TEXT_NODE = 3;
var COMMENT_NODE = 8;

function compile ( app, scope, element ) {
  var i, j, node;

  if ( element.hasChildNodes() ) {
    // var childNodes = element.childNodes;
    // console.log("A", childNodes.length);

    // Copy nodes into array as directives might manipulate DOM.
    var childNodes = [];
    for ( i = 0, j = element.childNodes.length; i < j; i++ ) {
      childNodes.push(element.childNodes[i]);
    }

    for ( i = 0, j = childNodes.length; i < j; i++ ) {
      node = childNodes[i];

      var nodeType = node.nodeType;

      if ( nodeType === ELEMENT_NODE ) {
        var preventCompile = compileAttributes(app, scope, node, node.attributes);
        if ( !preventCompile ) {
          compile(app, scope, node);
        }
      }
      else if ( nodeType === TEXT_NODE ) {
        // console.log("text", node);
        // console.log("text", node.nodeValue);
        interpolateFn(node, scope);
      }
    }
  }
}

function compileAttributes ( app, scope, element, attrs ) {
  var i, j, attr;

  var $element = $(element);
  var preventCompile = false;

  for ( i = 0, j = attrs.length; i < j; i++ ) {
    attr = attrs[i];
    // console.log("attr", attr);

    var directive = app.directives[attr.name];
    if ( directive ) {
      if ( directive.link(scope, $element, attrs) ) {
        preventCompile = true;
      }
    }
  }

  return preventCompile;
}

var interpolateRegExp = /\{\{\s*([\w\.]+)\s*(?:|(.*))?\}\}/g;

function interpolateFn ( textNode, scope ) {
  var text = textNode.nodeValue;

  var update = function ( newValue, oldValue ) {
    textNode.nodeValue = text.replace(interpolateRegExp, function ( line, prop, filters ) {
      var result = scope.$eval(prop) || "";

      if ( filters ) {
        buildFilterExpr(filters);
      }

      if ( typeof result === "object" ) {
        result = JSON.stringify(result);
      }
      return result;
    });
  };

  update();

  text.replace(interpolateRegExp, function ( line, prop ) {
    scope.$watch(prop, update);
  });
}

var filterRegExp = /([a-z_$]+[a-z0-9_$])(?:\s*:\s*(.+))?/i;
var filterArgsRegExp = /([^:\s]+)/;

function buildFilterExpr ( filterStr ) {
  var filters = filterStr.split("|");
  var buffer = "";

  var stack = [];

  for ( var i = filters.length - 1; i >= 0; i-- ) {
    var filterMatch = filters[i].match(filterRegExp);
    if ( filterMatch ) {
      console.log(filterMatch);
      buffer += "filter('" + filterMatch[1] + "')(";
      if ( filterMatch[2] ) {
        filterMatch[2].replace(filterArgsRegExp, function ( line, arg ) {
          console.log(arg);
        });
      }
    }
  }

  buffer += "input)";
  console.log(buffer);
}
