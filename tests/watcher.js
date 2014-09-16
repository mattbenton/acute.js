acute.model = (function () {
  var bind = Function.prototype.bind;
  if ( Function.prototype.bind ) {
    bind = function ( fn, thisArg ) {
      return fn.bind(thisArg);
    };
  } else {
    bind = function ( fn, thisArg ) {
      return function () {
        fn.apply(thisArg, Array.prototype.slice.call(arguments));
      };
    };
  }

  var isArray = acute.isArray;
  var isFunction = acute.isFunction;

  function Model ( obj ) {
    for ( var prop in obj ) {
      this[prop] = obj[prop];
    }

    this.$observers = {};
  }

  // var acute = window.acute || {};

  // acute.model = Model.wrap = function ( obj ) {
  //   // if ( typeof obj !== "object" || obj instanceof Model ) {
  //   if ( canWrap(obj) ) {
  //     if ( acute.isArray(obj) ) {
  //       return Model.wrapArray(obj);
  //     }
  //     return new Model(obj);
  //   }
  //   return obj;
  // };

  function model ( obj ) {
    if ( canWrap(obj) ) {
      if ( acute.isArray(obj) ) {
        return wrapArray(obj);
      }
      return wrapObject(obj);
    }
    return obj;
  }

  model.Model = Model;
  model.Observer = Observer;

  function wrapObject ( obj ) {
    return new Model(obj);
  }

  function wrapArray ( arr ) {
    var model = new Model(arr);
    model.$arr = arr;

    arr.$observers = model.$observers;
    // arr.watch = model.watch.bind(model);
    // arr.set = model.set.bind(model);

    arr.watch = bind(model.watch, model);
    arr.set = bind(model.set, model);

    arr.pop = function () {
      if ( arr.length ) {
        var value = Array.prototype.pop.call(arr);

        var change = new ChangeRecord();
        change.type = "remove";
        change.index = arr.length;
        change.value = value;
        model.emit("$pop", change);

        return value;
      }
      return;
    };

    arr.push = function () {
      var values = Array.prototype.slice.call(arguments);
      var startIndex = arr.length;
      Array.prototype.push.apply(arr, values);

      var change = new ChangeRecord();
      change.type = "add";
      change.index = startIndex;
      change.values = values;

      model.emit("$push", change);
      return arr.length;
    };

    return arr;
  }

  function canWrap ( obj ) {
    return (typeof obj === "object" && !(obj instanceof Model) && !obj.watch);
  }

  function isModel ( obj ) {
    return (typeof obj === "object" && obj.watch);
  }

  ///
  // Copies observers from the `source` to `target` model.
  //
  // TODO: New observers are initialized with identical information
  // to allow old observers to GC and avoid memory leaks. This could be
  // fixed to assign observers by reference later.
  //
  function copyObservers ( source, target ) {
    var sourceObservers = source.$observers;
    var targetObservers = target.$observers;

    var path, i, len;
    for ( path in sourceObservers ) {
      var targetOb = new Observer(target, path);
      targetObservers[path] = targetOb;

      var sourceListeners = sourceObservers[path].listeners;
      for ( i = 0, len = sourceListeners.length; i < len; i++ ) {
        targetOb.add(sourceListeners[i]);
      }
    }
  }

  Model.prototype.watch = function ( path, callback ) {
    var keys = path.split(".");
    var observers = this.$observers;
    for ( var i = 0, len = keys.length; i < len; i++ ) {
      var key = keys.slice(0, i + 1).join(".");
      var ob = observers[key];
      if ( !ob ) {
        ob = new Observer(this, key);
        observers[key] = ob;
      }

      ob.add(callback);
      // var ob = new Observer(this, keys.slice(0, i + 1).join("."));
    }
    // acute.log(this);

    // TODO: return unwatch function
  };

  Model.prototype.unwatch = function () {

  };

  Model.prototype.unwatchAll = function () {
    var observers = this.$observers;
    for ( var prop in observers ) {
      observers[prop].destroy();
    }
  };

  Model.prototype.set = function ( key, value ) {
    value = model(value);
    var newValueIsModel = isModel(value);

    var oldValue = this[key];
    if ( isModel(oldValue) ) {
      if ( newValueIsModel ) {
        // oldValue
      }
    }

    if ( oldValue instanceof Model ) {
      oldValue.unwatchAll();

      // if ( Model.canWrap(value) ) {
      //   // ok
      // } else {
      //   acute.log("#@#@#");
      // }
    }
    value = model(value);

    if ( isModel(value) && isArray(value) ) {
      acute.log("wrapped arrray");
      var that = this;

      value.watch("$pop", function ( change ) {
        that.emit(key, change);
      });

      value.watch("$push", function ( change ) {
        that.emit(key, change);
      });
    }

    if ( value instanceof Model ) {
      this.syncObservers(key, value);
    }

    if ( this.$arr ) {
      this.$arr[key] = value;
    } else {
      this[key] = value;
    }

    var change = new ChangeRecord();
    change.name = key;
    change.type = (typeof oldValue === "undefined") ? "add" : "update";
    this.emit(key, change);

    acute.log("set # $ctx", this.$ctx);

    acute.log("set", key, value, this.$observers);
  };

  Model.prototype.syncObservers = function ( key, childModel ) {
    acute.log("sync", key, childModel);

    var observers = this.$observers;
    for ( var path in observers ) {
      // if ( path === key || path.indexOf(key + ".") === 0 ) {
      if ( path.indexOf(key + ".") === 0 ) {
        var ob = observers[path];
        acute.log("sync here", path);
        path = path.replace(key + ".", "");
        acute.log("fix", path, ob);

        // for ( var i = 0, len = ob.listeners.length; i < len; i)
        ob.copyListeners(childModel, path);
      }
    }
  };

  Model.prototype.emit = function ( key ) {
    acute.log("emit", key, arguments);
    var args = Array.prototype.slice.call(arguments, 1);

    var ob = this.$observers[key];
    if ( ob ) {
      ob.emit.apply(ob, args);
    }

    ob = this.$observers["*"];
    if ( ob ) {
      ob.emit.apply(ob, args);
    }
  };

  /**
  * Observers maintain a list of listeners which subscribe to
  * changes on a specific path on a model.
  */
  function Observer ( model, path ) {
    acute.log("new Observer", model, path);

    this.listeners = [];
  }

  /**
  * Copies all listeners from the observer to a certain path on a
  * model. This is necessary when a child model is replaced and
  * all existing observers need to be copied to the new model.
  */
  Observer.prototype.copyListeners = function ( model, path ) {
    var listeners = this.listeners;
    for ( var i = 0, len = listeners.length; i < len; i++ ) {
      model.watch(path, listeners[i]);
    }
  };

  /**
  * Adds a callback function to be invoked when the
  * observed path changes.
  */
  Observer.prototype.add = function ( callback ) {
    this.listeners.push(callback);
  };

  /**
  * Removes a previously added callback function for the
  * observed path changes.
  */
  Observer.prototype.remove = function ( callback ) {

  };

  /**
  * Invokes all listeners.
  */
  Observer.prototype.emit = function () {
    var listeners = this.listeners;
    for ( var i = 0, len = listeners.length; i < len; i++ ) {
      listeners[i].apply(null, Array.prototype.slice.call(arguments));
    }
  };

  /**
  * Frees all references to listener callbacks. This occurs
  * when an observed path gets replaced or removed.
  */
  Observer.prototype.destroy = function () {
    acute.log("destroying observer with", listeners.length, "listeners");
    this.listeners = null;
  };

  function ChangeRecord () {

  }

  return model;
}());

var model = acute.model({
  name: "matt",
  age: 26
});

// model.get("name");

// model.set("age", 50);

// model.gf.set("name", "Hello");

// watch for changes on gf or gf.name
// model.watch("gf.name", function () {
//   acute.log("changed gf.name");
// });

function changeFn ( change ) {
  acute.log("changed", change);
}

model.watch("*", changeFn);

model.watch("name", changeFn);

model.watch("colors", function ( change ) {
  acute.log("changed colors", change);
});

model.set("gf", { name: "Decca" });

model.set("colors", ["red", "green"]);

acute.log(model);

model.colors.watch("0", function () { acute.log("changed color 0"); })
