/**
* Watcher
*/

var watchAccessor = new LinkedListAccessor("head", "tail", "prev", "next");

var addedAccessor = new LinkedListAccessor("added", "addedTail", "prev", "next");
var removedAccessor = new LinkedListAccessor("removed", "removedTail", "prev", "next");
var updatedAccessor = new LinkedListAccessor("updated", "updatedTail", "prev", "next");
var movedAccessor = new LinkedListAccessor("moved", "movedTail", "prev", "next");

function Watcher () {
  this.head = null;
  this.tail = null;
}

Watcher.createRecord = function ( context, field ) {
  var obj = context[field];
  if ( isPlainObject(obj) ) {
    return new ObjectWatch(context, field);
  } else if ( isArray(obj) ) {
    return new ArrayWatch2(context, field);
  }
  // } else if ( typeof obj !== "undefined" ) {
    return new PrimitiveWatch(context, field);
  // }
  // console.log("value is undefined");
  // return new UnknownWatch(context, field);
};

var WATCHER_HASH_KEY_COUNT = 0;
Watcher.getNextHaskKey = function () {
  WATCHER_HASH_KEY_COUNT++;
  return "$" + WATCHER_HASH_KEY_COUNT;
};

Watcher.createChangeRecord = function () {
  return {
    added: null,
    removed: null,
    updated: null,
    moved: null
  };
};

Watcher.digestRecord = function ( record, type, changes ) {
  var lastValue = record.value;
  if ( record.digest() ) {
    if ( changes ) {
      if ( type === "add" ) {
        addedAccessor.append(changes, {
          type: type,
          name: record.field,
          value: record.value,
          record: record
        });
      } else if ( type === "update" ) {
        updatedAccessor.append(changes, {
          type: type,
          name: record.field,
          value: record.value,
          lastValue: lastValue,
          record: record
        });
      } else if ( type === "remove" ) {
        removedAccessor.append(changes, {
          type: type,
          name: record.field,
          lastValue: lastValue,
          record: record
        });
      }
    }
    return true;
  }
  return false;
};

Watcher.prototype.watch = function ( context, field, onChange ) {
  var record = Watcher.createRecord(context, field);
  if ( !record ) {
    return;
  }
  record.onChange = onChange;
  watchAccessor.append(this, record);

  console.log(record);

  if ( onChange ) {
    var changes = Watcher.createChangeRecord();
    if ( record.digest(changes) ) {
      onChange(changes);
    }
  }

  return function unwatch () {
    record.onChange = null;
    watchAccessor.remove(this, record);
  };
};

Watcher.prototype.digest = function () {
  var changes = Watcher.createChangeRecord();

  var removeList = [];
  var didChange = false;

  var record = this.head;
  while ( record ) {
    // console.log("rec", record);
    var changed = record.digest(changes);
    if ( changed ) {
      didChange = true;
      if ( record instanceof UnknownWatch ) {
        var newRecord = Watcher.createRecord(record.context, record.field);
        newRecord.onChange = record.onChange;
        watchAccessor.append(this, newRecord);
        console.log("unknown change", changed, newRecord);
        removeList.push(record);
      } else if ( record.onChange ) {
        // console.log("onChange", record);
        record.onChange(changes);
      }

      // if ( record.onChange ) {
        // console.log("onChange2", record);
        // record.onChange(changes);
      // }
    }
    record = record.next;
  }

  for ( var i = 0, length = removeList.length; i < length; i++ ) {
    watchAccessor.remove(this, removeList[i]);
  }

  return didChange;
};

function UnknownWatch ( context, field ) {
  this.context = context;
  this.field = field;
  this.value = context[field];
  this.matt = createGetter(field);
  // console.debug(this.getter);
}

UnknownWatch.prototype.digest = function () {
  // var value = this.context[this.field];
  console.debug("digest unknown", this.context, this.matt);

  // var value = this.matt && this.matt(null, 2);
  // alert(v);

  // var value = this.matt(this.context);

  // var value = this.getter(this.context);
  if ( typeof value !== "undefined" ) {
    if ( isPlainObject(value) ) {
      return "object";
    } else if ( isArray(value) ) {
      return "array";
    }
    return "primitive";
  }
  return false;
};

function PrimitiveWatch ( context, field ) {
  this.context = context;
  this.field = field;
  this.getter = createGetter(field);
  // this.value = context[field];
}

PrimitiveWatch.prototype.digest = function () {
  // var value = this.context[this.field];
  var value = this.getter(this.context);
  // console.log("matt", value);
  if ( this.value !== value ) {
    this.value = value;
    if ( typeof value !== "object" ) {
      console.log("change type");
    }
    return true;
  }
  return false;
};

function ObjectWatch ( context, field ) {
  this.context = context;
  this.field = field;
  this.records = {};
  this.value = context[field];
}

ObjectWatch.prototype.digest = function ( changes ) {
  var obj = this.context[this.field];
  var records = this.records;
  var prop, record;

  var didChange = false;
  var toRemove = [];

  // console.log("digest object");

  if ( this.value !== obj ) {
    this.value = obj;
    console.log("entire object changed");
  }

  for ( prop in records ) {
    if ( !obj.hasOwnProperty(prop) ) {
      didChange = true;
      record = records[prop];
      if ( changes ) {
        removedAccessor.append(changes, {
          type: "remove",
          name: prop,
          record: record
        });
      }
      toRemove.push(prop);
    }
  }

  for ( var i = 0, length = toRemove.length; i < length; i++ ) {
    delete records[toRemove[i]];
  }

  for ( prop in obj ) {
    if ( prop.charAt(0) === "$" ) {
      continue;
    }

    record = records[prop];
    if ( record ) {
      if ( Watcher.digestRecord(record, "update", changes) ) {
        didChange = true;
      }
    } else {
      record = Watcher.createRecord(obj, prop);
      records[prop] = record;

      // Force new record to store current values.
      Watcher.digestRecord(record, "add", changes);
      didChange = true;
    }
  }

  return didChange;
};

function ArrayWatch2 ( context, field ) {
  this.context = context;
  this.field = field;
  this.keys = {};
}

ArrayWatch2.prototype.digest = function ( changes ) {
  var array = this.context[this.field];
  var keys = this.keys;
  var didChange = false;
  var keysSeen = {};

  var index, length, item, hashKey, record;

  for ( index = 0, length = array.length; index < length; index++ ) {
    item = array[index];
    if ( !isPlainObject(item) ) {
      throw new Error("Cannot watch array with non-object value");
    }

    hashKey = item.$hashKey;
    if ( hashKey && keysSeen[hashKey] ) {
      throw new Error("Duplicate hash key on ArrayWatch");
    }

    if ( !(hashKey && keys[hashKey]) ) {
      // add
      if ( !hashKey ) {
        hashKey = Watcher.getNextHaskKey();
        item.$hashKey = hashKey;

        // Mark it as being seen.
        keysSeen[hashKey] = true;

        record = Watcher.createRecord(array, index);
        keys[hashKey] = record;

        // Force new record to store current values.
        didChange = true;
        Watcher.digestRecord(record, "add", changes);
      }
    } else {
      // Check for change
      record = keys[hashKey];
      if ( Watcher.digestRecord(record, "update", changes) ) {
        didChange = true;
      }
    }
  }

  return didChange;
};

function ArrayWatch ( context, field ) {
  this.context = context;
  this.field = field;
  this.records = [];
  this.keys = {};
  this.isOptimized = null;
  this.value = context[field];
}

ArrayWatch.prototype.digest = function ( changes ) {
  var array = this.context[this.field];
  var records = this.records;
  var keys = this.keys;
  var isOptimized = this.isOptimized;
  var didChange = false;

  // console.log("digest array");

  if ( this.value !== array ) {
    this.value = array;
    console.log("entire array changed");
  }

  // Map of keeys already seen.
  var keysSeen = {};

  var index, length;
  var item, hashKey;
  var record, doAdd;
  var lastValue;

  for ( index = 0, length = array.length; index < length; index++ ) {
    item = array[index];

    if ( isPlainObject(item) ) {
      if ( isOptimized === null ) {
        // Mark as optimized if possible.
        this.isOptimized = isOptimized = true;
      }

      if ( isOptimized ) {
        doAdd = false;
        hashKey = item.$hashKey;
        // console.debug("has key", hashKey, item);
        if ( hashKey ) {
          if ( keysSeen[hashKey] ) {
            // Already seen this key.
            throw new Error("Duplicate hash key on ArrayWatch");
          }

          // One or more watches are watching this item.
          if ( keys[hashKey] ) {
            // We are already watching item.
            keysSeen[hashKey] = true;
          } else {
            doAdd = true;
          }
        } else {
          // Nobody is watching this new item.
          doAdd = true;
        }

        if ( doAdd ) {
          if ( !hashKey ) {
            hashKey = item.$hashKey = Watcher.getNextHaskKey();
          }

          // Mark it as being seen.
          keysSeen[hashKey] = true;

          record = records[index] = Watcher.createRecord(array, index);

          // Force new record to store current values.
          didChange = true;
          keys[hashKey] = record;
          Watcher.digestRecord(record, "add", changes);
        } else {
          // Check for change
          record = records[index];

          if ( Watcher.digestRecord(record, "update", changes) ) {
            didChange = true;
          }
        }
      } // Object && isOptimized
    } else if ( isOptimized ) {
      throw new Error("Non-object found on object-optimized ArrayWatch");
    } else {
      // Plain checks

      record = records[index];
      if ( !record ) {
        record = records[index] = Watcher.createRecord(array, index);
        Watcher.digestRecord(record, "add", changes);
      } else {
        if ( Watcher.digestRecord(record, "update", changes) ) {
          didChange = true;
        }
      }
    }
  }

  // Detect removals for optimized arrays
  if ( isOptimized ) {
    for ( hashKey in keys ) {
      record = keys[hashKey];
      item = array[record.field];
      if ( typeof item === "undefined" ) {
        didChange = true;

        delete keys[hashKey];
        records.splice(record.field, 1);

        if ( changes ) {
          removedAccessor.append(changes, {
            type: "remove",
            index: record.field,
            record: record
          });
        }
      }
    }
  } else {
    for ( index = records.length - 1; index >= 0; index-- ) {
      if ( !array.hasOwnProperty(index) ) {
        record = records[index];
        didChange = true;
        if ( changes ) {
          removedAccessor.append(changes, {
            type: "remove",
            index: record.field,
            record: record
          });
        }
        records.splice(index, 1);
      }
    }
  }

  return didChange;
};
