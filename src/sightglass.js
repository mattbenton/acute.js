var sightglass = acute.sightglass = (function() {
  // Public sightglass interface.
  function sightglass ( obj, keypath, callback, options ) {
    return new Observer(obj, keypath, callback, options);
  }

  // Batteries not included.
  sightglass.adapters = {};

  // Constructs a new keypath observer and kicks things off.
  function Observer ( obj, keypath, callback, options ) {
    // acute.log("create Observer");

    this.options = options || {};
    this.options.adapters = this.options.adapters || {};
    this.obj = obj;
    this.keypath = keypath;
    this.callback = callback;
    this.objectPath = [];
    this.parse();

    if ( typeof (this.target = this.realize()) !== 'undefined' ) {
      this.set(true, this.key, this.target, this.callback);
    }
  }

  // Tokenizes the provided keypath string into interface + path tokens for the
  // observer to work with.
  Observer.tokenize = function ( keypath, interfaces, root ) {
    // acute.log("Observer.tokenize");

    var tokens = [];
    var current = { interface: root, path: '' };

    var index;
    for ( index = 0; index < keypath.length; index++ ) {
      var chr = keypath.charAt(index);

      // if(!!~interfaces.indexOf(chr)) {
      if ( interfaces.indexOf(chr) >= 0 ) {
        tokens.push(current);
        current = { interface: chr, path: '' };
      } else {
        current.path += chr;
      }
    }

    tokens.push(current);
    return tokens;
  };

  // Parses the keypath using the interfaces defined on the view. Sets variables
  // for the tokenized keypath as well as the end key.
  Observer.prototype.parse = function () {
    // acute.log("Observer.parse");

    var interfaces = this.interfaces();

    if ( !interfaces.length ) {
      error('Must define at least one adapter interface.');
    }

    var root;
    var path;
    // if(!!~interfaces.indexOf(this.keypath[0])) {
    if ( interfaces.indexOf(this.keypath[0]) >= 0 ) {
      root = this.keypath[0];
      path = this.keypath.substr(1);
    } else {
      if ( typeof (root = this.options.root || sightglass.root) === 'undefined' ) {
        error('Must define a default root adapter.');
      }

      path = this.keypath;
    }

    this.tokens = Observer.tokenize(path, interfaces, root);
    this.key = this.tokens.pop();
  };

  // Realizes the full keypath, attaching observers for every key and correcting
  // old observers to any changed objects in the keypath.
  Observer.prototype.realize = function () {
    // acute.log("Observer.realize 4");

    var current = this.obj;
    var unreached = false;

    // acute.log("tokens", this.tokens);

    this.tokens.forEach(function ( token, index ) {
      var prev;

      if ( typeof current !== 'undefined' ) {
        if ( typeof this.objectPath[index] !== 'undefined' ) {
          if ( current !== (prev = this.objectPath[index]) ) {
            this.set(false, token, prev, this.update.bind(this));
            this.set(true, token, current, this.update.bind(this));
            this.objectPath[index] = current;
          }
        } else {
          this.set(true, token, current, this.update.bind(this));
          // acute.log("Observer.realize this", this);
          if ( !this.objectPath ) {
            // acute.log("Observer.realize no objectPath");
          }
          if ( !this.objectPath.length ) {
            // acute.log("Observer.realize no objectPath array");
          }
          // acute.log("Observer.realize length", this.objectPath.length);
          // acute.log("Observer.realize index", index);

          this.objectPath[index] = current;
        }

        current = this.get(token, current);
      } else {
        if ( unreached === false ) {
          unreached = index;
        }

        prev = this.objectPath[index];
        if ( prev ) {
          this.set(false, token, prev, this.update.bind(this));
        }
      }
    }, this);

    if ( unreached !== false ) {
      this.objectPath.splice(unreached);
    }

    return current;
  };

  // Updates the keypath. This is called when any intermediary key is changed.
  Observer.prototype.update = function () {
    // acute.log("Observer.update");

    var next;
    if ( (next = this.realize()) !== this.target ) {
      if ( typeof this.target !== 'undefined' ) {
        this.set(false, this.key, this.target, this.callback);
      }

      if ( typeof next !== 'undefined' ) {
        this.set(true, this.key, next, this.callback);
      }

      var oldValue = this.value();
      this.target = next;

      if ( this.value() !== oldValue ) this.callback();
    }
  };

  // Reads the current end value of the observed keypath. Returns undefined if
  // the full keypath is unreachable.
  Observer.prototype.value = function() {
    // acute.log("Observer.value");

    if ( typeof this.target !== 'undefined' ) {
      return this.get(this.key, this.target);
    }
  };

  // Sets the current end value of the observed keypath. Calling setValue when
  // the full keypath is unreachable is a no-op.
  Observer.prototype.setValue = function ( value ) {
    // acute.log("Observer.setValue");

    if ( typeof this.target !== 'undefined' ) {
      this.adapter(this.key).set(this.target, this.key.path, value);
    }
  };

  // Gets the provided key on an object.
  Observer.prototype.get = function ( key, obj ) {
    // acute.log("Observer.get");

    return this.adapter(key).get(obj, key.path);
  };

  // Observes or unobserves a callback on the object using the provided key.
  Observer.prototype.set = function ( active, key, obj, callback ) {
    // acute.log("Observer.set");

    var action = active ? 'observe' : 'unobserve';
    this.adapter(key)[action](obj, key.path, callback);
  };

  // Returns an array of all unique adapter interfaces available.
  Observer.prototype.interfaces = function () {
    // acute.log("Observer.interfaces");

    var interfaces = Object.keys(this.options.adapters);

    Object.keys(sightglass.adapters).forEach(function ( interface ) {
      if ( interfaces.indexOf(interface) < 0 ) {
        interfaces.push(interface);
      }
    });

    return interfaces;
  };

  // Convenience function to grab the adapter for a specific key.
  Observer.prototype.adapter = function ( key ) {
    // acute.log("Observer.adapter");

    return this.options.adapters[key.interface] ||
      sightglass.adapters[key.interface];
  };

  // Unobserves the entire keypath.
  Observer.prototype.unobserve = function () {
    // acute.log("Observer.unobserve");

    this.tokens.forEach(function ( token, index ) {
      var obj = this.objectPath[index];
      if ( obj ) {
        this.set(false, token, obj, this.update.bind(this));
      }
    }, this);

    if ( typeof this.target !== 'undefined' ) {
      this.set(false, this.key, this.target, this.callback);
    }
  };

  // Error thrower.
  function error ( message ) {
    throw new Error('[sightglass] ' + message);
  }

  return sightglass;
}());
