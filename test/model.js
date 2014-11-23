function Model () {
  this.data = {};
  this.paths = {};
}

Model.prototype = {
  get: function ( path ) {
    return get(this.data, path);
  },

  set: function ( path, value ) {
    set(this.data, path, value);
    this.notify("set", path);
  },

  del: function ( path ) {
    var data = this.data,
      match = path.match(/^(.*?)\.([^\.]+)$/),
      name = path;

    if ( match ) {
      data = get(data, match[1]);
      name = match[2];
    }

    if ( typeof data === "object" ) {
      var value = data[name];
      delete data[name];
      this.notify("del", path, void 0, value);
      return value;
    }
  },

  notify: function ( type, path, newValue, oldValue ) {
    // console.log("notify", type, path, newValue, oldValue);
    var watchedPaths = this.paths;
    for ( var key in watchedPaths ) {
      var watchedPath = watchedPaths[key];
      var match = path.match(watchedPath.pattern);
      if ( match ) {
        // console.log("changed", match);
        var listeners = watchedPath.listeners;
        for ( var i = 0; i < listeners.length; i++ ) {
          listeners[i](type, path, newValue, oldValue);
        }
      }
    }
  },

  push: function ( path, value ) {
    var array = get(this.data, path);
    if ( typeof array.push === "function" ) {
      var length = array.length;
      array.push(value);
      this.notify("push", path + "." + length, value);
    }
  },

  pop: function ( path ) {
    var array = get(this.data, path);
    if ( typeof array.pop === "function" ) {
      var value = array.pop();
      this.notify("pop", path + "." + array.length, void 0, value);
      return value;
    }
  },

  toJson: function () {
    return JSON.stringify(this.data, null, 2);
  },

  watch: function ( path, options, listener ) {
    if ( typeof options === "function" ) {
      listener = options;
      options = {};
    }
    // var listeners = this.listeners[path];
    var watched = this.paths[path];
    if ( !watched ) {
      watched = this.paths[path] = {
        listeners: [],
        // pattern: new RegExp("^" + path.replace(/\./g, "\\.").replace(/\*/g, "(.*?)") + "\.?(.*)")
        pattern: new RegExp("^" + path.replace(/\./g, "\\.").replace(/\*/g, "(.*?)") + "(.*)")
      };
    }
    // console.log("watch", path, options, watched.pattern);
    watched.listeners.push(listener);
  }
};

function get ( data, path ) {
  var keys = path.split(".");
  while ( typeof data === "object" && keys.length ) {
    var key = keys.shift();
    data = data[key];
  }
  if ( !keys.length ) {
    return data;
  }
}

function set ( data, path, value ) {
  var keys = path.split(".");
  while ( keys.length ) {
    var key = keys.shift();
    if ( keys.length ) {
      if ( typeof data[key] !== "object" ) {
        data = data[key] = {};
      } else {
        data = data[key];
      }
    } else {
      data[key] = value;
    }
  }
}

var model = new Model();

// model.watch("user", function () {
//   console.log("user changed");
// });

model.watch("user.cats", function ( type, path, newValue, oldValue ) {
  console.log("cat changed", arguments);
});

model.data = {
  user: {
    cats: []
  }
};

model.push("user.cats", { name: "The Wedge" });
model.push("user.cats", { name: "LB" });
model.pop("user.cats");

// model.del("user.cat");

// model.set("user.name", "matt");
// model.set("user.age", 27);
// model.set("user.cat.name", "wedge");

// model.get("user2.age2");


console.debug(model.toJson());

// model.push("x", "34")
// model.set("x.3.age", "4")
