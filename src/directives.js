/**
* Default directives
*/

defaultDirectives["ng-show"] = {
  link: function ( scope, $element, attrs ) {
    var prop = attrs["ng-show"].value;
    var value = scope.$eval(prop);
    scope.$watch(prop, function ( value ) {
      $element.toggle(!!value);
    });
    $element.toggle(!!value);
  }
};

defaultDirectives["ng-hide"] = {
  link: function ( scope, $element, attrs ) {
    var prop = attrs["ng-hide"].value;
    var value = scope.$eval(prop);
    scope.$watch(prop, function ( value ) {
      $element.toggle(!!!value);
    });
    $element.toggle(!!!value);
  }
};

defaultDirectives["ng-click"] = {
  link: function ( scope, $element, attrs ) {
    var expr = attrs["ng-click"].value;
    $element.on("click", function () {
      scope.$eval(expr);
      // scope.$digest();
      console.log("click digest", scope);
    });
  }
};

defaultDirectives["ng-repeat"] = {
  link: function ( scope, $element, attrs ) {
    var expr = attrs["ng-repeat"].value;
    var match = expr.match(/for\s+(\w+)\s+in\s+(.+)/);
    if ( match ) {
      var iterator = match[1];
      var listName = match[2];
      var $parent = $element.parent();
      var $clone = $element.remove().clone();

      // console.log("ng-repeat", iterator, listName);

      var childScopes = [];

      var update = function ( items ) {
        var i, j;
        // console.log("update ng-repeat", listName, items);

        for ( i = 0, j = childScopes.length; i < j; i++ ) {
          childScopes[i].$destroy();
        }
        childScopes = [];

        $parent.children().off().remove();

        var item, $child;

        if ( isArray(items) ) {
          for ( i = 0, j = items.length; i < j; i++ ) {
            item = items[i];
            $child = $clone.clone().appendTo($parent);

            var childScope = scope.$new();
            childScope[iterator] = item;

            // console.log("child", childScope);

            childScopes.push(childScope);

            compile(scope.$app, childScope, $child[0]);
          }
        }
        // } else if ( isPlainObject(items) ) {
        //   for ( var key in items ) {
        //     item = items[key];
        //   }
        // }
      };

      scope.$watch(listName, update);
    }

    return true;
  }
};
