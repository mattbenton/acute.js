function Observable ( obj ) {
  if ( obj instanceof Observable ) {
    throw new Error("Already an Observable");
  }

  this.$listeners = [];
  // this.$context = obj;

  // if ( acute.isPlainObject(obj) ) {
  //   for ( var prop in obj ) {
  //     var value = obj[prop];
  //     if ( !(value instanceof Observable) ) {
  //       this[prop] = new Observable(value);
  //     }
  //   }
  // }
}

Observable.wrap = function ( obj ) {
  if ( !(obj instanceof Observable) ) {
    if ( acute.isPlainObject(obj) ) {
      var observer = new Observable();
      for ( var prop in obj ) {
        observer[prop] = Observable.wrap(obj[prop]);
      }
      return observer;
    }
  }
  return obj;
};

Observable.prototype.$get = function () {

};

Observable.prototype.$subscribe = function ( path, callback ) {

};

Observable.prototype.$update = function ( path, value ) {
  if ( arguments.length > 1 ) {
    this[path] = value;
  }
};

Observable.prototype.$emit = function ( path ) {
  var listeners = this.$listeners;
  for ( var i = 0, len = listeners.length; i < len; i++ ) {
    var listener = listeners[i];
    // if ( listener.)
  }
};

function Model () {
  this.$directListeners = [];
  this.$childListeners = [];
}

Model.prototype.$on = function ( path, callback ) {
  var keys = path.split(".");
  if ( keys.length > 1 ) {
    // child
  } else {
    // direct
  }
};

Model.prototype.$update = function ( path, value ) {

};

Model.wrap = function ( obj, parentModel ) {
  if ( typeof obj === "object" ) {
    if ( obj.$on ) {
      return obj;
    }
  }
};

acute.model = function ( obj, parentModel ) {
  if ( !acute.isPlainObject(obj) ) {
    return obj;
  }

  if ( acute.isPlainObject(obj) ) {
    for ( var prop in obj ) {
      acute.log(prop);
    }
  }

  obj.$listeners = [];

  obj.$update = function ( path, value ) {
    var oldValue = obj[path];

    if ( arguments.length > 1 ) {
      obj[path] = acute.model(value);
    } else {
      value = obj[path];
    }

    var listeners = obj.$listeners;
    for ( var i = 0, len = listeners.length; i < len; i++ ) {
      var listener = listeners[i];
      if ( listener.path === path ) {
        listener.callback(value, oldValue);
      }
    }
  };

  obj.$on = function ( path, callback ) {
    obj.$listeners.push({ path: path, callback: callback });
  };

  obj.$digest = function () {
    for ( var prop in obj ) {
      var value = obj[prop];
      if ( typeof value === "object" && !value.$update ) {
        acute.model(value);
      }
    }
  };

  obj.$digest();

  return obj;
};
/*
var model = acute.model({
  offer: {
    id: 123
  },
  wallet: {
    offers: [
      {
        id: 123
      },
      {
        id: 1000
      }
    ]
  }
});

model.$on("name", function ( newValue, oldValue ) {
  acute.log("changed name!", newValue, oldValue);
});

model.$on("gf.name", function () {
  acute.log("got gf");
});

// model.$update("name", "Matt");

// model.offer.$update("id", 50);

model.$update("gf", { name: "Decca" });*/


// // var offer = acute.observe(model.offer);
// // offer.

// var model = {
//   name: "Matt",
//   age: 26,
//   gf: {
//     name: "Decca",
//     age: 24
//   }
// };

// model.name = "matt";

// model.update();

function makeObservable ( obj ) {
  acute.log("makeObservable", obj);
  if ( obj && typeof obj === "object" && !obj.$on ) {
    obj.$listeners = [];

    obj.$on = function ( key, callback ) {
      obj.$listeners.push({
        key: key,
        callback: callback
      });
    };

    obj.$off = function ( key, callback ) {
      var listeners = obj.$listeners;
      for ( var index = listeners.length - 1; index >= 0; index-- ) {
        var listener = listeners[index];
        if ( listener.key === key && listener.callback === callback ) {
          listeners.splice(index, 1);
        }
      }
    };

    obj.$get = function ( path ) {
      // var keys = path.split(".");
      return "";
    };

    obj.$set = function ( key, value ) {
      var oldValue = obj[key];
      if ( arguments.length > 1 ) {
        obj[key] = value;
      } else {
        value = oldValue;
      }

      obj.$emit(key, value, oldValue);
      // var listeners = obj.$listeners;
      // for ( var i = 0, len = listeners.length; i < len; i++ ) {
      //   var listener = listeners[i];
      //   if ( listener.key === key ) {
      //     listener.callback(value, oldValue);
      //   }
      // }
    };

    obj.$emit = function ( key, value, oldValue ) {
      var listeners = obj.$listeners;
      for ( var i = 0, len = listeners.length; i < len; i++ ) {
        var listener = listeners[i];
        if ( listener.key === key ) {
          listener.callback(value, oldValue);
        }
      }
    };

    if ( acute.isArray(obj) ) {
      acute.log("make observable array");

      obj.pop = function () {
        Array.prototype.pop.call(this);
        obj.$emit("$pop");
      };

      obj.push = function ( value ) {
        Array.prototype.push.call(this, value);
        obj.$emit("$push");
      };
    }
  }
}

// // model = new Observable(model);
// model = Observable.wrap(model);

sightglass.root = ".";
sightglass.adapters["."] = {
  observe: function ( obj, key, callback ) {
    acute.log("observe '%s' on", key, obj, callback);

    if ( typeof obj === "object" ) {
      makeObservable(obj);
      if ( obj && obj.$on ) {
        obj.$on(key, callback);
      }

      var value = obj[key];
      acute.log("val", value);
      if ( acute.isArray(value) ) {
        makeObservable(value);
        value.$on("$pop", callback);
        value.$on("$push", callback);
      }
    }
  },
  unobserve: function ( obj, key, callback ) {
    acute.log("unobserve '%s' on", key, obj);

    if ( typeof obj === "object" && obj.$off ) {
      obj.$off(key, callback);
    }
  },
  get: function ( obj, key ) {
    acute.log("get '%s' on", key, obj);
    if ( typeof obj === "object" ) {
      // return obj.$get(key);
      return obj[key];
    }
  },
  set: function ( obj, key, value ) {
    acute.log("set '%s' on", key, obj);
  }
};

var model = {
  name: "Matt",
  gf: {
    name: "Decca"
  },
  colors: [
    { name: "red" },
    { name: "blue" }
  ]
};

function init () {
  acute.enableLog();
  acute.log(model);

  // var observer = sightglass(model, "gf.mother.name", function ( val, old ) {
  //   // acute.log("changed", Array.prototype.slice.call(arguments));
  //   acute.log("changed name");
  // });

  var observer = sightglass(model, "colors", function () {
    acute.log("changed colors");
  });

  acute.log("observer", observer);

  if ( model && model.gf && model.gf.$set ) {
    model.gf.$set("mother", { name: "Celia" });
  }

  if ( model && model.colors ) {
    model.colors.push({ name: "green" });
  }

  // model.$set("name", "sdfdsfff");

  // acute.log("observer", observer);

  // sightglass(model, "name", function () {
  //   // acute.log("changed name", arguments);
  // });

}

// var value = sightglass.adapters[observer.key.interface].get(model, observer.keypath);
// acute.log("value", value);


