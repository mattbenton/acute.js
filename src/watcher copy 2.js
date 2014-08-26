/**
* Watcher
*/

var observerAccessor = new LinkedListAccessor("head", "tail", "prev", "next");

var WATCHER_TYPE_PRIMITIVE = 0;
var WATCHER_TYPE_OBJECT = 1;
var WATCHER_TYPE_ARRAY = 2;

var MAX_DEPTH = 5;

acute.Watcher = Watcher2;
function Watcher2 () {
  this.head = null;
  this.tail = null;
}

var a = {
  name: "Matt",
  age: 26,
  gf: {
    name: "Decca",
    age: 24
  },
  colors: [
    "green",
    "blue"
  ]
};

var graph = {
  context: a,
  type: "object",
  fields: {
    name: {
      context: a,
      type: "primitive",
      field: "name",
      lastValue: "Matt",
    },
    age: {
      context: a,
      type: "primitive",
      field: "age",
      lastValue: 26
    },
    gf: {
      context: a,
      type: "object",
      field: "gf",
      lastValue: a.gf,
      fields: {
        name: {
          context: a.gf,
          type: "primitive",
          field: "name",
          lastValue: "Decca"
        }
      }
    },
    colors: {
      context: a,
      type: "array",
      field: "colors",
      length: 2,
      lastValue: a.colors,
      head: {
        context: a.colors,
        type: "primitive",
        index: 0,
        lastValue: "green",
        next: {
          context: a.colors,
          type: "primitive",
          index: 1,
          lastValue: "blue"
        }
      }
    }
  }
};

var watchAccessor = new LinkedListAccessor("head", "tail", "prev", "next");

acute.W = W;
function W () {
  this.head = null;
  this.tail = null;
}

W.prototype.watchObject = function ( obj, field, onChange ) {
  var value = obj[field];

  var record = {
    context: obj,
    field: field,
    value: value
  };

  var props = record.props = {};

  if ( isPlainObject(value) ) {
    for ( var prop in value ) {
      // props[prop] = this.createRecord(obj, value[prop]);
    }
  }
};

W.prototype.digest = function () {
  var current = this.head;
  while ( current ) {
    var change = this.digestRecord(null, current);
    if ( change ) {
      current.onChange(change);
    }
    current = current.next;
  }
};

W.prototype.digestRecord = function ( parent, record ) {
  if ( record.type === WATCHER_TYPE_PRIMITIVE ) {
    var value = record.context[record.field];
    if ( value !== record.value ) {
      // var change = {
      //   type: "update",
      //   lastValue: record.value
      //   record: record
      // };
      // record.value = value;
      // return change;
      console.log("changed", record.field);
    }
  } else  if ( record.type === WATCHER_TYPE_OBJECT ) {
    return this.digestObject(record);
  } else  if ( record.type === WATCHER_TYPE_ARRAY ) {
  }
};

W.prototype.digestObjectRecord = function ( record ) {
  var context = record.context;
  var fields = record.fields;
  var prop;

  for ( prop in context ) {
    var fieldRecord = fields[prop];
    if ( fieldRecord ) {
      // this.digestRecord(fieldRecord);
    } else {
      // // added
      // // create record
      // fields[prop] = this.createRecord(context, prop);
      console.log("added", prop);
    }
  }

  for ( prop in fields ) {
    if ( !context.hasOwnProperty(prop) ) {
      // deleted
      // var rec = fields[prop];
      // delete fields[prop];
      console.log("removed", prop);
    }
  }
};

W.prototype.watch = function ( obj, field ) {
  var record = this.createRecord(obj, field);
  console.log(record);
  if ( record ) {
    watchAccessor.append(this, record);
    return function unwatch () {
      watchAccessor.remove(this, record);
    };
  }
  return function unwatchNoop () {};
};

W.prototype.createRecord = function ( obj, field ) {
  var value = (field !== null && typeof field !== "undefined") ? obj[field] : obj;
  var record, records;

  if ( isPlainObject(value) ) {
    record = {
      type: WATCHER_TYPE_OBJECT,
      context: obj,
      field: field,
      value: value,
      head: null,
      tail: null
    };
    // records = record.records = {};
    for ( var prop in value ) {
      // records[prop] = this.createRecord(value, prop);
      // var rec =
    }
  } else if ( isArray(value) ) {
    record = {
      type: WATCHER_TYPE_ARRAY,
      context: obj,
      field: field,
      value: value,
      length: value.length
    };
    records = record.records = [];
    for ( var i = 0, j = value.length; i < j; i++ ) {
      records[i] = this.createRecord(value, i);
    }
  } else if ( typeof field !== "undefined" ) {
    record = {
      type: WATCHER_TYPE_PRIMITIVE,
      context: obj,
      field: field,
      value: obj[field]
    };
  } else {
    throw "Primitive field undefined";
  }
  return record;
};

W.prototype.createObjectRecord = function ( obj, field ) {
  var record = {
    type: WATCHER_TYPE_OBJECT,
    context: obj,
    field: field,
    value: value,
    head: null,
    tail: null
  };

  for ( var prop in value ) {
    var child = this.createRecord(value, prop);
    watchAccessor.append(record, child);
  }
};

W.prototype.createArrayRecord = function ( obj, field ) {
  var record = {
    type: WATCHER_TYPE_ARRAY,
    context: obj,
    field: field,
    value: value,
    length: value.length,
    head: null,
    tail: null
  };

  for ( var i = 0, j = value.length; i < j; i++ ) {
    var child = this.createRecord(value, i);
    watchAccessor.append(record, child);
  }
};

W.prototype.digest = function () {
  var current = this.head;
  while ( current ) {
    this.digestRecord(current);
    current = current.next;
  }
};

W.prototype.digestRecord = function ( record, parentRecord ) {
  var field = record.field;
  var value = null;
  var records;

  console.log("digest record", record.field, record);

  if ( field !== null && typeof field !== "undefined" ) {
    value = record.context[field];
  }

  if ( record.type === WATCHER_TYPE_PRIMITIVE ) {
    if ( record.value !== value ) {
      console.log("changed primitive", field, record.value, value);
      record.value = value;
    }
  } else if ( record.type === WATCHER_TYPE_OBJECT ) {
    if ( value !== null && value !== record.value ) {
      console.log("changed whole object", field);
      record.value = value;
    }

    records = record.records;
    for ( var prop in records ) {
      this.digestRecord(records[prop], record);
    }
  } else if ( record.type === WATCHER_TYPE_ARRAY ) {
    if ( value !== null && value !== record.value ) {
      console.log("changed whole array", field);
      record.value = value;
    }

    records = record.records;
    for ( var i = 0, j = records.length; i < j; i++ ) {
      this.digestRecord(records[i], record);
    }
  }

  if ( parentRecord ) {
    if ( typeof value === "undefined" ) {
      console.log("removed");
      // watchAccessor.remove(parentRecord, record);
    }
  }
};

W.prototype.digestObjectRecord = function ( record ) {
  // for ( var field in record.records ) {
  //   var change = this.digestRecord(record.records[field]);
  //   if ( change === CHANGE_REMOVE ) {

  //   }
  // }
};

// 1,2,3,4,5,6
// 1,3,2

// delete 4, 5, 6

// remove 2

Watcher2.prototype.watch = function ( obj, prop, isDeep ) {
  if ( !obj ) {
    throw "Obj can't be falsy";
  }

  if ( arguments.length === 1 ) {
    prop = null;
  }

  if ( arguments.length === 2 ) {
    if ( typeof prop === "boolean" ) {
      isDeep = prop;
      prop = null;
    } else {
      isDeep = false;

      if ( isPlainObject(obj) && typeof prop !== "string" ) {
        throw "Prop must be a string when observing an object";
      } else if ( isArray(obj) && typeof prop !== "number" ) {
        throw "Prop must be a number when observing an array";
      }
    }
  }

  var record = this.createRecord(obj, prop, isDeep ? MAX_DEPTH : 1);
  observerAccessor.append(this, record);

  return function unwatch () {
    observerAccessor.remove(this, record);
  };
};

Watcher2.prototype.createRecord = function ( obj, prop, level ) {
  var value = (prop !== null) ? obj[prop] : obj;
  if ( isPlainObject(value) ) {
    return this.createObjectRecord(value, level);
  } else if ( isArray(value) ) {
    return this.createArrayRecord(value, level);
  } else {
    return {
      obj: obj,
      type: WATCHER_TYPE_PRIMITIVE,
      prop: prop,
      lastValue: obj[prop],
      level: level
    };
  }
};

Watcher2.prototype.createObjectRecord = function ( obj, level ) {
  var record = {
    obj: obj,
    type: WATCHER_TYPE_OBJECT,
    level: level,
  };

  if ( level > 0 ) {
    var records = record.records = {};
    for ( var prop in obj ) {
      records[prop] = this.createRecord(obj, prop, level - 1);
    }
  }

  return record;
};

Watcher2.prototype.createArrayRecord = function ( obj, level ) {
  var record = {
    obj: obj,
    type: WATCHER_TYPE_ARRAY,
    level: level,
    length: obj.length
  };

  if ( level > 0 ) {
    var records = record.records = {};
    for ( var i = 0, j = obj.length; i < j; i++ ) {
      records[prop] = this.createRecord(obj, prop, level - 1);
    }
  }

  return record;
};

Watcher2.prototype.digest = function () {
  var current = this.head;
  while ( current ) {
    this.digestRecord(current);
    current = current.next;
  }
};

Watcher2.prototype.digestRecord = function ( record ) {
  if ( record.type === WATCHER_TYPE_OBJECT ) {
    this.digestObjectRecord(record);
  }
};

Watcher2.prototype.digestObjectRecord = function ( record ) {
  console.log("digest object", record);

  var prop;
  var obj = record.obj;
  var records = record.records;
  if ( records ) {
    for ( var key in records ) {

    }
  } else {
    // if (  )
  }
};

window.Observer = Observer;

function Observer () {
  this.head = null;
  this.tail = null;
}

Observer.prototype.observe = function ( obj, prop, isDeep ) {
  if ( !obj ) {
    throw "Obj can't be falsy";
  }

  if ( arguments.length === 1 ) {
    prop = null;
  }

  if ( arguments.length === 2 ) {
    if ( typeof prop === "boolean" ) {
      isDeep = prop;
      prop = null;
    } else {
      isDeep = false;

      if ( isPlainObject(obj) && typeof prop !== "string" ) {
        throw "Prop must be a string when observing an object";
      } else if ( isArray(obj) && typeof prop !== "number" ) {
        throw "Prop must be a number when observing an array";
      }
    }
  }

  var record = this.createRecord(obj, prop, isDeep);
  observerAccessor.append(this, record);

  return function unobserve () {
    observerAccessor.remove(this, record);
  };
};

Observer.prototype.createRecord = function ( obj, prop, isDeep ) {
  var value = (prop !== null) ? obj[prop] : obj;
  if ( isPlainObject(value) ) {
    return this.createObjectRecord(value, isDeep);
  } else if ( isArray(value) ) {
    return this.createArrayRecord(value, isDeep);
  } else if ( prop !== null ) {
    return {
      obj: obj,
      prop: prop,
      type: WATCHER_TYPE_PRIMITIVE,
      lastValue: value
    };
  } else {
    throw "Cannot watch primitive type without context";
  }
};

Observer.prototype.createObjectRecord = function ( obj, isDeep ) {
  // var record = {
  //   obj: obj,
  //   type: WATCHER_TYPE_OBJECT,
  //   head: null,
  //   tail: null
  // };

  var record = {
    obj: obj,
    type: WATCHER_TYPE_OBJECT
  };

  var records = record.records = {};

  for ( var prop in obj ) {
    records[prop] = this.createRecord(obj, prop, isDeep);
  }

  return record;
};

Observer.prototype.createArrayRecord = function ( obj, isDeep ) {
  var record = {
    obj: obj,
    type: WATCHER_TYPE_ARRAY,
    length: obj.length,
    head: null,
    tail: null
  };

  for ( var i = 0, j = obj.length; i < j; i++ ) {
    var rec = this.createRecord(obj, i, isDeep);
    observerAccessor.append(record, rec);
  }

  return record;
};

Observer.prototype.digest = function () {
  var current = this.head;
  while ( current ) {
    this.digestRecord(current);
    current = current.next;
  }
};

Observer.prototype.digestRecord = function ( record ) {
  if ( record.type === WATCHER_TYPE_PRIMITIVE ) {
    var value = record.obj[record.prop];
    if ( value !== record.lastValue ) {
      console.log("changed primitive:", value, record.lastValue);
      record.lastValue = value;
    }
  } else if ( record.type === WATCHER_TYPE_OBJECT ) {
    this.digestObject(record);
  }
};

// TODO: detect additions
Observer.prototype.digestObject = function ( record ) {
  console.log("digest object", record);
  // var current = record.head;
  // while ( current ) {
  //   if ( record.deep ) {

  //   } else {
  //     var value = record.obj[current.prop];
  //     console.log("check object", current.prop, value, current.lastValue);
  //     if ( value !== current.lastValue ) {
  //       console.log("change object prop", current.prop, value, current.lastValue);
  //       if ( typeof value === "undefined" && !record.obj.hasOwnProperty(current.prop) ) {
  //         console.log("deleted prop", current.prop);

  //         var temp = current.next;
  //         observerAccessor.remove(record, current);
  //         current = temp;
  //         continue;
  //       }
  //     }
  //   }
  //   current = current.next;
  // }
};

var watcherAccessor = new LinkedListAccessor("head", "tail", "prev", "next");

function Watcher () {
  this.head = null;
  this.tail = null;
}

Watcher.prototype.watch = function ( obj, field, handler ) {
  var record = {
    obj: obj,
    field: field,
    handler: handler
  };

  var value = obj && obj[field];
  // record.lastValue = value;
  // record.lastJson = JSON.stringify(value);

  watcherAccessor.append(this, record);

  return function removeWatch () {
    watcherAccessor.remove(this, record);
  };
};

Watcher.prototype.digest = function () {
  var current = this.head;
  while ( current ) {
    var value = current.obj[current.field];
    var json = JSON.stringify(value);

    if ( value !== current.lastValue || json !== current.lastJson ) {
      // change
      // console.log("change", current.field, value, current.lastValue);
      current.handler(value, current.lastValue);

      current.lastValue = value;
      current.lastJson = json;
    }

    current = current.next;
  }
};

Watcher.prototype.poll = function ( intervalMs ) {
  intervalMs = intervalMs || 1000;

  if ( this.pollIntervalId ) {
    clearInterval(this.pollIntervalId);
    this.pollIntervalId = nul;
  }

  if ( intervalMs > 0 ) {
    var that = this;
    this.pollIntervalId = setInterval(function () {
      that.digest();
    }, intervalMs);
  }

  this.digest();

  return this;
};
