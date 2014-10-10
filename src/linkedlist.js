/**
* LinkedListAccessor
*/

/* jshint evil: true */

function LinkedListAccessor ( head, tail, prev, next ) {
  // item.prev = item.next = null;
  // if ( !head ) { head = item; }
  // if ( tail ) { tail.next = item; item.prev = tail; }
  // tail = item;
  this.append = new Function("o, i", "i." + prev + " = i." + next + " = null; if ( !o." + head + " ) { o." + head + " = i; } if ( o." + tail + " ) { o." + tail + "." + next + " = i; i." + prev + " = o." + tail + "; } o." + tail + " = i;");

  // item.prev = item.next = null;
  // if ( head ) { head.prev = item; item.next = head; }
  // head = item;
  // if ( !tail ) { tail = item; }
  this.prepend = new Function("o, i", "i." + prev + " = i." + next + " = null; if ( o." + head + " ) { o." + head + "." + prev + " = i; i." + next + " = o." + head + "; } o." + head + " = i; if ( !o." + tail + " ) { o." + tail + " = i; }");

  // if ( item.prev ) { item.prev.next = item.next; }
  // if ( item.next ) { item.next.prev = item.prev; }
  // if ( item === head ) { head = item.next; }
  // if ( item === tail ) { tail = item.prev; }
  // item.prev = item.next = null;
  this.remove = new Function("o, i", "if ( i." + prev + " ) { i." + prev + "." + next + " = i" + "." + next + "; } if ( i." + next + " ) { i." + next + "." + prev + " = i." + prev + "; } if ( i === o." + head + " ) { o." + head + " = i." + next + "; } if ( i === o." + tail + " ) { o." + tail + " = i." + prev + "; } i. " + prev + " = i." + next + " = null;");

  // replace.prev = item.prev;
  // replace.next = item.next;
  // if ( replace.next)

  // this.replace = new Function("o, i, r");
}

exports = LinkedListAccessor;
