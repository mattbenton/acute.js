(function () {

  function Observer ( context ) {
    this.context = context;
    this.watches = {};
    this.locals = {};
  }

  Observer.prototype.get = function ( keypath ) {
    return get(keypath, this.context, this.locals);
  };

  Observer.prototype.set = function ( keypath, value ) {
    // user.gf.name = "Decca"

    // user = { name: "matt", age: 27, gf: { name: "Decca" }}

    if ( isPlainObject(value) ) {

    }

    set(this.context, keypath, value);
  };

  function set ( keypath, value, context, locals, changes ) {
    var current;
    if ( isPlainObject(value) ) {
      for ( var key in value ) {
        current = get(keypath + "." + key, context, locals, true);
        // if ( current.broken  )
      }
    } else if ( isArray(value) ) {

    } else {
      current = get(keypath, context, locals, true);
      if ( current.broken || current.value !== value ) {
        changes.push({
          keypath: keypath,
          value: value,
          lastValue: context[keypath]
        });
        context[keypath] = value;
      }
    }
  }

  Observer.prototype.notify = function ( keypath, handler ) {
    var keys = keypath.split(".");


  };

  // user

  Observer.prototype.watch = function ( keypath, handler ) {
    // var watch =
  };

  function stripKeyPath ( keypath ) {
    return keypath.replace(/['"]/g, "").replace(/\[([^\]]+)\]/g, ".$1");
  }

  function get ( keypath, context, locals, withInfo ) {
    var keys = stripKeyPath(keypath).split(".");

    var isBroken = false;

    var gotLocal = true;
    var key, i, len, value;

    if ( locals ) {
      value = locals;
      for ( i = 0, len = keys.length; i < len; i++ ) {
        key = keys[i];
        if ( typeof value === "object" && value.hasOwnProperty(key) ) {
          value = value[key];
        } else {
          isBroken = true;
          break;
        }
      }
    }

    if ( isBroken ) {
      isBroken = false;
      gotLocal = false;

      value = context;
      for ( i = 0, len = keys.length; i < len; i++ ) {
        key = keys[i];
        if ( typeof value === "object" && value.hasOwnProperty(key) ) {
          value = value[key];
        } else {
          isBroken = true;
          break;
        }
      }
    }

    if ( withInfo ) {
      if ( isBroken ) {
        return {
          path: path,
          broken: isBroken
        };
      }

      return {
        path: path,
        value: value,
        broken: isBroken,
        local: gotLocal
      };
    }

    if ( !isBroken ) {
      return value;
    }
  }

  function set ( keypath, value, context ) {
    var keys = stripKeyPath(keypath).split(".");
    for ( var i = 0, len = keys.length; i < len; i++ ) {
      var key = keys[i];
      if ( i < len - 1 ) {
        if ( typeof context === "object" && context.hasOwnProperty(key) ) {
          context = context[key];
        } else {
          return false;
        }
      } else {
        context[key] = value;
        return true;
      }
    }
  }

  function Watch () {

  }

});
