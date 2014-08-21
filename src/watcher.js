/**
* Watcher
*/

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

  // if ( !this.head ) {
  //   this.head = record;
  // }
  // if ( this.tail ) {
  //   this.tail.next = record;
  // }
  // this.tail = record;

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
