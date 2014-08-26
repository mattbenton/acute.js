/**
* Watcher
*/

var WATCHER_TYPE_PRIMITIVE = 0;
var WATCHER_TYPE_OBJECT = 1;
var WATCHER_TYPE_ARRAY = 2;

var WATCHER_CHANGE_ADD = "add";
var WATCHER_CHANGE_MOVE = "move";
var WATCHER_CHANGE_REMOVE = "remove";
var WATCHER_CHANGE_UPDATE = "update";

var WATCHER_HASH_KEY_COUNT = 0;

var watchAccessor = new LinkedListAccessor("head", "tail", "prev", "next");

var addedAccessor = new LinkedListAccessor("added", "addedTail", "prev", "next");
var removedAccessor = new LinkedListAccessor("removed", "removedTail", "prev", "next");
var updatedAccessor = new LinkedListAccessor("updated", "updatedTail", "prev", "next");
var movedAccessor = new LinkedListAccessor("moved", "movedTail", "prev", "next");

function nextWatcherHashKey () {
  WATCHER_HASH_KEY_COUNT++;
  return "$" + WATCHER_HASH_KEY_COUNT;
}

acute.Watcher = Watcher;
function Watcher () {
  this.head = null;
  this.tail = null;
}

Watcher.prototype.watch = function ( obj, field, onChange ) {
  if ( typeof field === "undefined" ) {
    throw "Field is null";
  }

  console.log("watch", field);

  var changes = this.createChangeRecord();

  var record = this.createRecord(obj, field, onChange);
  record.onChange = onChange;
  watchAccessor.append(this, record);
  console.log(record);
  return function unwatch () {
    watchAccessor.remove(this, record);
  };
};

Watcher.prototype.createChangeRecord = function () {
  return {
    added: null,
    removed: null,
    updated: null,
    moved: null
  };
};

Watcher.prototype.createRecord = function ( context, field, changes ) {
  var value = context[field];
  if ( isPlainObject(value) ) {
    return this.createObjectRecord(context, field, changes);
    // return this.createCollectionRecord(context, field);
  } else if ( isArray(value) ) {
    return this.createArrayRecord(context, field, onChange);
    // return this.createCollectionRecord(context, field);
  } else {
    return {
      type: WATCHER_TYPE_PRIMITIVE,
      context: context,
      field: field,
      value: value
    };
  }
};

/*Watcher.prototype.createCollectionRecord = function ( context, field ) {
  var obj = context[field];

  var record = {
    context: context,
    field: field,
    type: WATCHER_TYPE_OBJECT,
    value: obj,
  };

  var records = record.records = {};

  if ( isPlainObject(obj) ) {
    for ( var prop in obj ) {
      records[prop] = this.createRecord(obj, prop);
    }
  } else if ( isArray(obj) ) {
    for ( var index = 0, length = obj.length; index < length; index++ ) {
      records[index] = this.createRecord(obj, index);
    }
  }

  return record;
};*/

Watcher.prototype.createObjectRecord = function ( context, field, changes ) {
  var object = context[field];

  var record = {
    context: context,
    field: field,
    type: WATCHER_TYPE_OBJECT,
    value: object,
  };

  var records = record.records = {};
  var prop, rec;

  for ( prop in object ) {
    records[prop] = this.createRecord(object, prop);
  }

  if ( changes ) {
    for ( prop in records ) {
      rec = records[prop];
      var change = {
        type: WATCHER_CHANGE_ADD,
        name: prop,
        record: rec
      };
      addedAccessor.append(changes, change);
    }
  }

  return record;
};

Watcher.prototype.createArrayRecord = function ( context, field, changes ) {
  var array = context[field];

  var record = {
    context: context,
    field: field,
    type: WATCHER_TYPE_ARRAY,
    value: array,
    length: array.length
  };

  var records = record.records = [];
  var recordsByKey = record.recordsByKey = {};
  var index, length, item, hashKey, rec;

  for ( index = 0, length = array.length; index < length; index++ ) {
    item = array[index];
    if ( isPlainObject(item) ) {
      hashKey = item.$hashKey;
      if ( !hashKey ) {
        hashKey = item.$hashKey = nextWatcherHashKey();
      }
    } else {
      hashKey = null;
    }

    rec = records[index] = this.createRecord(array, index);

    if ( hashKey ) {
      recordsByKey[hashKey] = rec;
      rec.hashKey = hashKey;
    }
  }

  if ( changes ) {
    for ( index = 0, length = records.length; index < length; index++ ) {
      rec = records[index];
      var change = {
        type: WATCHER_CHANGE_ADD,
        index: index,
        record: rec
      };
      addedAccessor.append(changes, change);
    }
  }

  return record;
};

Watcher.prototype.digest = function () {
  console.log("digest");
  var current = this.head;
  while ( current ) {
    var changes = this.createChangeRecord();
    this.digestRecord(current, changes);
    if ( changes.added || changes.removed || changes.updated || changes.moved ) {
      current.onChange(changes);
    }
    current = current.next;
  }
};

Watcher.prototype.digestRecord = function ( record, changes ) {
  if ( record.type === WATCHER_TYPE_PRIMITIVE ) {
    var value = record.context[record.field];
    if ( value !== record.value ) {
      console.log("changed", record.field);

      var lastValue = record.value;
      record.value = value;

      if ( changes ) {
        var change = {
          type: WATCHER_CHANGE_UPDATE,
          name: record.field,
          lastValue: record.value,
          record: record
        };
        updatedAccessor.append(changes, change);
      }
      return true;
    }
  } else if ( record.type === WATCHER_TYPE_OBJECT ) {
    return this.digestObjectRecord(record, changes);
  } else if ( record.type === WATCHER_TYPE_ARRAY ) {
    return this.digestArrayRecord(record, changes);
  }
  return false;
};

Watcher.prototype.digestObjectRecord = function ( record, changes ) {
  var context = record.context;
  var value = context[record.field];
  var records = record.records;
  var prop;

  var added = [];
  var removed = [];

  var rec, change;

  var didChange = false;

  if ( value !== record.value ) {
    console.log("changed whole object");
    return;
  }

  for ( prop in value ) {
    var fieldRecord = records[prop];
    if ( fieldRecord ) {
      if ( this.digestRecord(fieldRecord) ) {
        didChange = true;
        if ( changes ) {
          change = {
            type: WATCHER_CHANGE_UPDATE,
            name: prop,
            record: fieldRecord
          };
          updatedAccessor.append(changes, change);
        }
      }
    } else {
      didChange = true;
      rec = this.createRecord(value, prop);

      change = {
        type: WATCHER_CHANGE_ADD,
        name: prop,
        record: rec
      };
      addedAccessor.append(changes, change);

      added.push(rec);
    }
  }

  for ( prop in records ) {
    if ( !value.hasOwnProperty(prop) ) {
      didChange = true;
      rec = records[prop];
      change = {
        type: WATCHER_CHANGE_REMOVE,
        name: prop,
        record: rec
      };
      removedAccessor.append(changes, change);
      removed.push(rec);
    }
  }

  var i, j;
  for ( i = 0, j = added.length; i < j; i++ ) {
    records[added[i].field] = added[i];
  }

  for ( i = 0, j = removed.length; i < j; i++ ) {
    delete records[removed[i].field];
  }

  return didChange;
};

Watcher.prototype.digestArrayRecord = function ( record, changes ) {
  var context = record.context;
  var array = context[record.field];
  var indices = record.indices;
  var records = record.records;

  var added = [];
  var index, length, rec, item, hashKey, isNew;

  if ( array !== record.value ) {
    console.log("whole list changed");
    return;
  }

  var seen = {};

  for ( index = 0, length = array.length; index < length; index++ ) {
    item = array[index];
    isNew = false;

    console.log("item", item);
    if ( typeof item === "object" ) {
      hashKey = item.$hashKey;
      if ( hashKey ) {
        rec = indices[hashKey];
        if ( rec ) {
          seen[hashKey] = true;

          if ( rec.field !== index ) {
            // moved
            console.log("moved");
            chnages.push({
              type: WATCHER_CHANGE_MOVE,
              index: index,
              oldIndex: rec.field,
              record: rec
            });
          }
        } else {
          console.log("new 1");
          isNew = true;
        }
      } else {
        // new item
        console.log("new 2", item);
        isNew = true;
      }
    }

    if ( isNew ) {
      rec = this.createRecord(array, index);
      hashKey = rec.hashKey = nextWatcherHashKey();
      indices[hashKey] = rec;
      seen[hashKey] = true;

      changes.push({
        type: WATCHER_CHANGE_ADD,
        index: index,
        record: rec
      });

      added.push(rec);
    }
  }

  console.log(seen);

  // Check for removed items.
  for ( hashKey in indices ) {
    if ( !seen[hashKey] ) {
      rec = indices[hashKey];
      console.log("removed", hashKey);
      changes.push({
        type: WATCHER_CHANGE_REMOVE,
        index: rec.name
      });
    }
  }

  return changes.length && changes;
};

function GenericObserver () {
}

GenericObserver.prototype.createRecord = function ( context, field ) {
  var obj = context[field];
  if ( isPlainObject(obj) ) {
    return new ObjectObserver(context, field);
  } else if ( isArray(obj) ) {
    return new ArrayObserver(context, field);
  } else {
    return new PrimitiveObserver(context, field);
  }
};

function PrimitiveObserver ( context, field ) {
  this.context = context;
  this.field = field;
  this.value = context[field];
}

PrimitiveObserver.prototype = new GenericObserver();
PrimitiveObserver.prototype.constructor = PrimitiveObserver;

PrimitiveObserver.prototype.digest = function () {
  var value = this.context[this.field];
  if ( this.value !== value ) {
    this.value = value;
    return true;
  }
  return false;
};

function ObjectObserver ( context, field ) {
  this.context = context;
  this.field = field;
  this.records = {};
}

ObjectObserver.prototype = new GenericObserver();
ObjectObserver.prototype.constructor = ObjectObserver;

ObjectObserver.prototype.digest = function ( changes ) {
  var obj = this.context[this.field];
  var prop, record;

  var changes = {};
  var didChange = false;
  var toRemove = [];

  for ( prop in records ) {
    if ( !obj.hasOwnProperty(prop) ) {
      didChange = true;
      record = this.records[prop];
      if ( changes ) {
        removedAccessor.append(changes, {
          type: WATCHER_CHANGE_REMOVE,
          name: prop,
          record: record
        });
      }
      toRemove.push(prop);
    }
  }

  for ( var i = 0, length = toRemove.length; i < length; i++ ) {
    delete this.records[toRemove[i]];
  }

  for ( prop in obj ) {
    record = this.records[prop];
    if ( record ) {
      if ( record.digest() ) {
        didChange = true;
        if ( changes ) {
          updatedAccessor.append(changes, {
            type: WATCHER_CHANGE_UPDATE,
            name: prop,
            record: record
          });
        }
      }
    } else {
      record = this.createRecord(obj, prop);
      this.records[prop] = record;
      if ( changes ) {
        addedAccessor.append(changes, {
          type: WATCHER_CHANGE_ADD,
          name: prop,
          record: record
        });
      }
    }
  }

  return didChange;
};
