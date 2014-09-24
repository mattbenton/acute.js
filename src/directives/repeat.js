/**
* Default directives
*/

acute.directives.repeat = (function () {
  function RepeatDirective ( $template, expr, scope ) {
    this.scope = scope;

    $("<!-- ac-repeat: " + expr + " -->").insertBefore($template);
    this.$placeholder = $("<!-- end ac-repeat -->").insertAfter($template);

    this.$template = $template
      .removeAttr("ac-repeat")
      .remove();

    var match = expr.match(/for\s+([a-z0-9$_]+)(?:\s*,\s*([a-z0-9$_]+))?\s*in\s*([a-z0-9$_.]+)/i);
    if ( !match ) {
      throw new Error('acute: invalid repeat syntax: "' + expr + '"');
    }

    if ( match[2] ) {
      this.keyName = match[1];
      this.iteratorName = match[2];
    } else {
      this.iteratorName = match[1];
    }
    this.path = match[3];

    scope.watch(this.path, { context: this }, this.updateCollection);
  }

  RepeatDirective.stop = true;

  RepeatDirective.bind = function ( element, attrValue, attrs, scope ) {
    new RepeatDirective($(element), attrValue, scope);
  };

  RepeatDirective.prototype.updateCollection = function ( info ) {
    var changes = info.changes;
    if ( changes ) {
      for ( var i = 0, len = changes.length; i < len; i++ ) {
        var change = changes[i];
        if ( change.type === "add" ) {
          this.addItem(change);
        }
        else if ( change.type === "remove" ) {
          this.removeItem(change);
        }
        else if ( change.type === "move" ) {
          this.moveItem(change);
        }
      }
    }
  };

  RepeatDirective.prototype.addItem = function ( change ) {
    var scope = this.scope;

    var $clone = this.$template.clone().insertBefore(this.$placeholder);
    var childScope = scope.clone();

    var local = scope.get(change.path);
    childScope.locals[this.iteratorName] = local;

    if ( this.keyName ) {
      childScope.locals[this.keyName] = change.index;
    }

    var view = acute.view($clone[0], childScope);

    // Keep track of view
    change.data.view = view;
  };

  RepeatDirective.prototype.removeItem = function ( change ) {
    var view = change.data.view;
    if ( view ) {
      view.element.remove();
      view.destroy();
    }
  };

  RepeatDirective.prototype.moveItem = function ( change ) {
    var view = change.data.view;
    if ( view ) {
      view.scope.locals[this.keyName] = change.index;
    }
  };

  return RepeatDirective;
}());
