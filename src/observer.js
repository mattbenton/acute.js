/*jshint undef:true */

var Observer = acute.Observer = (function () {

  var UUID = 0;
  function nextUUID () {
    UUID++;
    return "$" + UUID;
  }

  function Observer ( context ) {
    this.paths = {};
    this.context = context;
    this.locals = {};
    this.destroyed = false;
  }

  Observer.prototype.destroy = function () {
    for ( var path in this.paths ) {
      this.paths[path].destroy();
    }
    this.context = null;
    this.locals = null;
    this.destroyed = true;
  };

  Observer.prototype.watch = function ( path, options, callback ) {
    if ( arguments.length < 2 ) {
      throw new Error("[acute] invalid watch arguments");
    }

    if ( arguments.length === 2 ) {
      callback = options;
      options = {};
    }

    options = extend({
      init: true, // notify initial state as changes
      context: null // callback execution context
    }, options);

    if ( !isPlainObject(options) ) {
      throw new Error("[acute] watch options must be an object");
    }

    if ( !isFunction(callback) ) {
      throw new Error("[acute] watch callback must be a function");
    }

    if ( isArray(path) ) {
      for ( var i = 0, len = path.length; i < len; i++ ) {
        this.watch(path[i], options, callback);
      }
      return;
    }

    var watchHash = getWatchHash(path, options);
    var watch = this.paths[watchHash];
    if ( !watch ) {
      watch = this.paths[watchHash] = new Watch(path, options, this);
    }

    watch.add({
      context: options.context,
      callback: callback
    });

    watch.digest(!!options.init);
  };

  Observer.prototype.unwatch = function () {

  };

  Observer.prototype.digest = function () {
    for ( var path in this.paths ) {
      if ( !this.destroyed ) {
        var watch = this.paths[path];
        watch.digest();
      }
    }
  };

  function parsePath ( path ) {
    return path.replace(/['"]/g, "").replace(/\[([^\]]+)\]/g, ".$1");
  }

  Observer.prototype.get = function ( path, withInfo ) {
    var keys = parsePath(path).split(".");

    var isBroken = false;

    var gotLocal = true;
    var key, i, len;

    var context = this.locals;
    for ( i = 0, len = keys.length; i < len; i++ ) {
      key = keys[i];
      if ( typeof context === "object" && context.hasOwnProperty(key) ) {
        context = context[key];
      } else {
        isBroken = true;
        break;
      }
    }

    if ( isBroken ) {
      isBroken = false;
      gotLocal = false;

      context = this.context;
      for ( i = 0, len = keys.length; i < len; i++ ) {
        key = keys[i];
        if ( typeof context === "object" && context.hasOwnProperty(key) ) {
          context = context[key];
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
        value: context,
        broken: isBroken,
        local: gotLocal
      };
    }

    if ( !isBroken ) {
      return context;
    }
  };

  Observer.prototype.set = function ( path, value ) {
    var keys = parsePath(path).split(".");
    var context = this.context;
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
  };

  function getWatchHash ( path, options ) {
    return path;
    // var hash = path + "#";
    // if ( options.init ) {
    //   hash += "i";
    // }
    // return hash;
  }

  function ChangeRecord ( watch ) {
    this.path = watch.path;
    this.name = watch.path.split(".").pop();
  }

  function Watch ( path, options, observer ) {
    this.listeners = [];

    this.observer = observer;
    this.path = path;
    this.options = options;
  }

  Watch.prototype.destroy = function () {
    for ( var i = 0, len = this.listeners.length; i < len; i++ ) {
      var record = this.listeners[i];
      record.callback = null;
      record.context = null;
    }
    this.listeners = null;
    this.observer = null;
    this.path = null;
    this.options = null;
  };

  Watch.prototype.notify = function ( change ) {
    acute.trace.s((this.preventNotify ? "prevent " : "") + "notify(" + this.listeners.length + ")", change);

    if ( !this.preventNotify ) {
      var listeners = this.listeners;
      for ( var i = 0, len = listeners.length; i < len; i++ ) {
        var record = listeners[i];
        record.callback.call(record.context, change);
      }
    }
  };

  Watch.prototype.removeChildren = function () {
    var children = this.children;
    if ( children ) {
      var changes = [];
      if ( this.type === "array" ) {
        for ( var uid in children ) {
          var child = children[uid];
          if ( this.type === "array" ) {
            changes.push({
              path: this.path + "[" + child.index + "]",
              type: "remove",
              index: child.index,
              data: child.data
            });
          }
        }
      }
      else if ( this.type === "object" ) {
        for ( var prop in children ) {
          var data = children[prop];
          changes.push({
            path: this.path + "." + prop,
            name: prop,
            type: "remove",
            data: data
          });
        }
      }

      if ( changes.length ) {
        var change = new ChangeRecord(this);
        change.type = "array";
        change.value = this.context;
        change.lastValue = this.value;
        change.changes = changes;
        this.notify(change);
      }
    }
    this.children = null;
  };

  Watch.prototype.digest = function ( notifyInit ) {
    // var pathInfo = this.observer.getPathInfo(this.path);
    var currentValue = this.observer.get(this.path);

    // var currentValue = pathInfo.value;
    // var type = pathInfo.type;
    var type = getType(currentValue);
    var change;

    if ( type !== "object" && type !== "array" ) {
      acute.trace.s("digest", this.path, JSON.stringify(currentValue));
    } else {
      acute.trace.s("digest", this.path, "[" + type + "]");
    }

    if ( type !== this.type && (this.type === "array" || this.type === "object") ) {
      acute.trace.s("changed from array or object to other. remove children");
      this.removeChildren();
    }

    if ( type === "array" ) {
      this.digestArray(currentValue, notifyInit);
    } else if ( type === "object" ) {
      this.digestObject(currentValue, notifyInit);
    } else {
      // acute.trace.s("digest other", currentValue);
      if ( currentValue !== this.value || notifyInit ) {
        // acute.trace.s(this.path, "changed");

        change = new ChangeRecord(this);
        change.value = currentValue;
        change.lastValue = this.value;
        this.notify(change);
      }
    }

    this.value = currentValue;
    this.type = type;
  };

  // Watch.prototype.digestChildren = function ( context, type ) {
  // };

  Watch.prototype.digestObject = function ( context, notifyInit ) {
    // acute.trace.s("digset object", context);

    var children = this.children;
    if ( !children ) {
      children = this.children = {};
    }

    var prop, child, value;

    var changes = [];
    var change;

    for ( prop in context ) {
      child = children[prop];
      value = context[prop];

      if ( !child ) {
        // new item
        // acute.trace.s("add", prop, value, child);
        children[prop] = {};
        changes.push({
          path: this.path + "." + prop,
          name: prop,
          type: "add",
          data: child
        });
      }
    }

    for ( prop in children ) {
      if ( !context.hasOwnProperty(prop) ) {
        // remove
        // acute.trace.s("remove", prop);
        delete children[prop];
        changes.push({
          path: this.path + "." + prop,
          name: prop,
          type: "remove",
          data: child
        });
      }
    }

    if ( changes.length ) {
      change = new ChangeRecord(this);
      change.type = "object";
      change.value = context;
      change.lastValue = this.value;
      change.changes = changes;
      this.notify(change);
    }
  };

  Watch.prototype.digestArray = function ( context, notifyInit ) {
    // acute.trace.s("digset array", context);

    var children = this.children;
    if ( !children ) {
      children = this.children = {};
    }

    var seenUIDs = {};

    var changes = [];

    var child, uid, value, type;
    for ( var index = 0, len = context.length; index < len; index++ ) {
      value = context[index];
      type = getType(value);

      if ( type !== "object" ) {
        throw new Error("[acute] cannot digest array with non-object values, path: '" + this.path + "'");
      }

      uid = value.$uid;
      if ( !uid ) {
        uid = value.$uid = nextUUID();
      }

      if ( seenUIDs[uid] ) {
        throw new Error("[acute] duplicate objects in array, path: '" + this.path + "'");
      }

      child = children[uid];
      if ( child ) {

        if ( child.index !== index ) {
          // moved
          changes.push({
            path: this.path + "[" + index + "]",
            type: "move",
            index: index,
            lastIndex: child.index,
            data: child.data
          });

          // acute.trace.s("moved", child, "from", child.index, "to", index);
          child.index = index;
        }
      } else {
        // added
        child = children[uid] = { value: value, index: index, data: {} };
        // acute.trace.s("added", child);
        changes.push({
          path: this.path + "[" + index + "]",
          type: "add",
          index: index,
          data: child.data
        });
      }

      seenUIDs[uid] = true;
    }

    for ( uid in children ) {
      if ( !seenUIDs[uid] ) {
        // removed
        child = children[uid];
        changes.push({
          path: this.path + "[" + child.index + "]",
          type: "remove",
          index: child.index,
          data: child.data
        });
        // acute.trace.s("removed", child);
        delete children[uid];
      }
    }

    if ( changes.length ) {
      var change = new ChangeRecord(this);
      change.type = "array";
      change.value = context;
      change.lastValue = this.value;
      change.changes = changes;
      this.notify(change);
    }
  };

  Watch.prototype.add = function ( listener ) {
    this.listeners.push(listener);
  };

  return Observer;
}());
