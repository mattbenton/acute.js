/**
* Event Emitter
*
* https://github.com/konsumer/emitonoff
*/

module.exports = function(thing){
  if (!thing) {
    thing = {};
  }

  thing.subs = [];

  /**
   * Sub of pubsub
   * @param  {String}   name name of event
   * @param  {Function} cb   your callback
   */
  thing.on = function ( name, cb ) {
    thing.subs[name] = thing.subs[name] || [];
    thing.subs[name].push(cb);
  };

  /**
   * remove sub of pubsub
   * @param  {String}   name name of event
   * @param  {Function} cb   your callback
   */
  thing.off = function ( name, cb ) {
    var subs = thing.subs[name];
    if ( subs ) {
      for ( var i = 0, len = subs.length; i < len; i++ ) {
        if ( subs[i] === cb ) {
          subs.splice(i);
          break;
        }
      }
    }
  };

  /**
   * Pub of pubsub
   * @param  {String}   name name of event
   * @param  {Mixed}    data the data to publish
   */
  thing.emit = function ( name ){
    var subs = thing.subs[name];
    if ( subs ) {
      var args = Array.prototype.slice.call(arguments, 1);
      for ( var i = 0, len = subs.length; i < len; i++ ) {
        subs[i].apply(thing, args);
      }
    }
  };

  return thing;
};
