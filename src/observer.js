var utils = require("./utils");

var UUID = 0;
function nextUUID () {
  UUID++;
  return "$" + UUID;
}

var WATCH_ID = 0;

function Observer ( context ) {
  this.paths = {};
  this.context = context;
  this.locals = {};
  this.destroyed = false;
  this.unwatches = {};
}

Observer.prototype.destroy = function () {
  for ( var path in this.paths ) {
    this.paths[path].destroy();
  }
  this.context = null;
  this.locals = null;
  this.destroyed = true;
};

/**
* @param {String|Object|Array} pathOrObj One or more paths to watch. If `path` is an
*   object, only keys have truthy values are watched.
*/
Observer.prototype.watch = function ( pathOrObj, options, callback ) {
  if ( arguments.length < 2 ) {
    throw new Error("[acute] invalid watch arguments");
  }

  if ( arguments.length === 2 ) {
    callback = options;
    options = {};
  }

  options = _.merge({
    init: true, // notify initial state as changes
    context: null // callback execution context
  }, options);

  if ( !_.isPlainObject(options) ) {
    throw new Error("[acute] watch options must be an object");
  }

  if ( !_.isFunction(callback) ) {
    throw new Error("[acute] watch callback must be a function");
  }

  var listener = {
    context: options.context,
    callback: callback
  };

  var watch;

  var unwatches;

  if ( typeof pathOrObj === "string" ) {
    watch = this.getWatch(pathOrObj);
    unwatches = watch.add(listener, options.init);
  } else if ( _.isPlainObject(pathOrObj) ) {
    unwatches = {};
    for ( var path in pathOrObj ) {
      if ( pathOrObj[path] ) {
        watch = this.getWatch(path);
        unwatches[path] = watch.add(listener, options.init);
      }
    }
  } else if ( _.isArray(pathOrObj) ) {
    unwatches = {};
    for ( var i = 0, len = pathOrObj.length; i < len; i++ ) {
      watch = this.getWatch(pathOrObj[i]);
      unwatches[pathOrObj[i]] = watch.add(listener, options.init);
    }
  }

  return unwatches;
};

Observer.prototype.getWatch = function ( path ) {
  var watch = this.paths[path];
  if ( !watch ) {
    watch = this.paths[path] = new Watch(path, this);
  }
  return watch;
};

Observer.prototype.unwatch = function ( watchId ) {
  if ( typeof watchId === "string" ) {
    var path = watchId.substr(0, watchId.indexOf("#"));
    var watch = this.paths[path];
    if ( watch ) {
      if ( watch.listeners[watchId] ) {
        delete watch.listeners[watchId];
        watch.count--;
      } else {
        throw new Error("Attempted to unwatch non-existent id '" + watchId + "'");
      }
    } else {
      throw new Error("Attempted to unwatch non-existent path for id '" + watchId + "'");
    }
  } else if ( _.isArray(watchId) ) {
    for ( var i = 0, len = watchId.length; i < len; i++ ) {
      this.unwatch(watchId[i]);
    }
  }
};

Observer.prototype.digest = function () {
  for ( var path in this.paths ) {
    if ( !this.destroyed ) {
      var watch = this.paths[path];
      if ( watch.count ) {
        watch.digest();
      }
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
    // if ( typeof context === "object" ) {
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
      // if ( typeof context === "object" ) {
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

function ChangeRecord ( watch ) {
  this.path = watch.path;
  this.name = watch.path.split(".").pop();
}

function Watch ( path, observer ) {
  // Keys are watchIds
  this.listeners = {};

  // Listener count
  this.count = 0;

  this.observer = observer;
  this.path = path;
}

Watch.prototype.destroy = function () {
  var listeners = this.listeners;
  for ( var watchId in listeners ) {
    var record = listeners[watchId];
    record.callback = null;
    record.context = null;
  }
  this.listeners = null;
  this.observer = null;
  this.path = null;
  this.options = null;
};

Watch.prototype.notify = function ( change ) {
  var listeners = this.listeners;
  for ( var watchId in listeners ) {
    var record = listeners[watchId];
    record.callback.call(record.context, change);
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

Watch.prototype.digest = function () {
  var didChange = false;
  var didRemoveChildren = false;

  var currentValue = this.observer.get(this.path);

  // var currentValue = pathInfo.value;
  // var type = pathInfo.type;
  var type = utils.getType(currentValue);
  var change;

  if ( type !== "object" && type !== "array" ) {
    // acute.trace.s("digest", this.path, JSON.stringify(currentValue));
  } else {
    // acute.trace.s("digest", this.path, "[" + type + "]");
  }

  if ( type !== this.type && (this.type === "array" || this.type === "object") ) {
    acute.trace.s("changed from array or object to other. remove children");
    didRemoveChildren = this.removeChildren();
  }

  if ( type === "array" ) {
    didChange = this.digestArray(currentValue);
  } else if ( type === "object" ) {
    didChange = this.digestObject(currentValue);
  } else {
    // acute.trace.s("digest other", currentValue);
    if ( currentValue !== this.value ) {
      // acute.trace.s(this.path, "changed");

      change = new ChangeRecord(this);
      change.value = currentValue;
      change.lastValue = this.value;
      this.notify(change);

      didChange = true;
    }
  }

  this.value = currentValue;
  this.type = type;

  return didChange || didRemoveChildren;
};

// Watch.prototype.digestChildren = function ( context, type ) {
// };

Watch.prototype.digestObject = function ( context ) {
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
    return true;
  }
};

Watch.prototype.digestArray = function ( context ) {
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
    type = utils.getType(value);

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
    return true;
  }
};

Watch.prototype.notifyInit = function ( listener ) {
  if ( !this.digest() ) {
    var type = this.type;
    if ( type === "array" ) {
      // didChange = this.digestArray(currentValue);
    } else if ( type === "object" ) {
      // didChange = this.digestObject(currentValue);
    } else {
      var change = new ChangeRecord(this);
      change.value = change.lastValue = this.value;
      listener.callback.call(listener.context, change);
    }
  }
};

Watch.prototype.add = function ( listener, initNotify ) {
  this.count++;
  var watchId = this.path + "#" + (WATCH_ID++);
  this.listeners[watchId] = listener;
  if ( initNotify ) {
    this.notifyInit(listener);
  }
  return watchId;
};

exports.Observer = Observer;
exports.Watch = Watch;
