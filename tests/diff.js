(function ( undefined ) {

  window.diff = accumulateDiff;
  function accumulateDiff ( lhs, rhs, prefilter, accum ) {
    accum = accum || [];
    deepDiff(lhs, rhs, function ( diff ) {
      if ( diff ) {
        accum.push(diff);
      }
    }, prefilter);
    return accum.length ? accum : null;
  }

  function deepDiff ( lhs, rhs, changes, prefilter, path, key, stack ) {
    path = path || [];
    var currentPath = path.slice(0);
    if ( typeof key !== "undefined" ) {
      if ( prefilter && prefilter(currentPath, key) ) {
        return;
      }
      currentPath.push(key);
    }

    var ltype = typeof lhs;
    var rtype = typeof rhs;

    if ( ltype === "object" && _.isArray(lhs) ) {
      ltype === "array";
    }

    if ( rtype === "object" && _.isArray(rhs) ) {
      rtype === "array";
    }

    if ( ltype === "undefined" ) {
      if ( rtype !== "undefined" ) {
        changes(createNewDiff(currentPath, rhs));
      }
    } else if ( rtype === "undefined" ) {
      changes(createDeleteDiff(currentPath, lhs));
    } else if ( ltype !== rtype ) {
      changes(createEditDiff(currentPath, lhs, rhs));
    } else if ( lhs instanceof Date && rhs instanceof Date && ((lhs - rhs) !== 0) ) {
      changes(createEditDiff(currentPath, lhs, rhs));
    } else if ( ltype === "object" && lhs !== null && rhs !== null ) {
      stack = stack || [];
      if ( _.indexOf(lhs) < 0 ) {
        stack.push(lhs);
        if ( _.isArray(lhs) ) {
          console.log("matt", lhs);
          var i;
          for ( i = 0; i < lhs.length; i++) {
            if ( i >= rhs.length ) {
              changes(createArrayDiff(currentPath, i, createDeleteDiff(undefined, lhs[i])));
            } else {
              deepDiff(lhs[i], rhs[i], changes, prefilter, currentPath, i, stack);
            }
          }
          while ( i < rhs.length ) {
            changes(createArrayDiff(currentPath, i, createNewDiff(undefined, rhs[i++])));
          }
        } else {
          var akeys = _.keys(lhs);
          var pkeys = _.keys(rhs);

          _.forEach(akeys, function ( k, i ) {
            var other = _.indexOf(pkeys, k);
            if ( other >= 0 ) {
              deepDiff(lhs[k], rhs[k], changes, prefilter, currentPath, k, stack);
              pkeys = arrayRemove(pkeys, other);
            } else {
              deepDiff(lhs[k], undefined, changes, prefilter, currentPath, k, stack);
            }
          });

          _.forEach(pkeys, function ( k ) {
            deepDiff(undefined, rhs[k], changes, prefilter, currentPath, k, stack);
          });
        }
        // stack.length = stack.length - 1;
        stack.pop();
      }
    } else if ( lhs !== rhs ) {
      if ( !(ltype === "number" && isNaN(lhs) && isNaN(rhs)) ) {
        changes(createEditDiff(currentPath, lhs, rhs));
      }
    }
  }

  function createDiff ( kind, path, extra ) {
    var obj = {
      kind: kind
    };
    if ( path && path.length ) {
      obj.path = path;
      obj.key = path.join(".");
    }
    for ( var prop in extra ) {
      obj[prop] = extra[prop];
    }
    return obj;
  }

  function createNewDiff ( path, value ) {
    var diff = createDiff("N", path);
    diff.rhs = value;
    return diff;
  }

  function createDeleteDiff ( path, value ) {
    var diff = createDiff("D", path);
    diff.lhs = value;
    return diff;
  }

  function createEditDiff ( path, origin, value ) {
    var diff = createDiff("E", path);
    diff.lhs = origin;
    diff.rhs = value;
    return diff;
  }

  function createArrayDiff ( path, index, item ) {
    var diff = createDiff("A", path);
    diff.index = index;
    diff.item = item;
    return diff;
  }

  function arrayRemove ( arr, from, to ) {
    // var rest = arr.slice((to || from) + 1 || arr.length);
    // arr.length = from < 0 ? arr.length + from : from;
    // arr.push.apply(arr, rest);
    arr.splice(from, 1);
    return arr;
  }

  function applyChange ( target, source, change ) {
    if ( target && source && change && change.kind ) {
      var it = target
      , i = -1
      , last = change.path.length - 1
      ;
      while ( ++i < last ) {
        if ( typeof it[change.path[i]] === "undefined" ) {
          it[change.path[i]] = (typeof change.path[i] === "number") ? [] : {};
        }
        it = it[change.path[i]];
      }
      switch ( change.kind ) {
        case "A":
          applyArrayChange(it[change.path[i]], change.index, change.item);
          break;
        case "D":
          delete it[change.path[i]];
          break;
        case "E":
        case "N":
          it[change.path[i]] = change.rhs;
          break;
      }
    }
  }

  function applyArrayChange ( arr, index, change ) {
    if ( change.path && change.path.length ) {
      var it = arr[index], i, u = change.path.length - 1;
      for ( i = 0; i < u; i++ ) {
        it = it[change.path[i]];
      }
      switch ( change.kind ) {
        case "A":
          applyArrayChange(it[change.path[i]], change.index, change.item);
          break;
        case "D":
          delete it[change.path[i]];
          break;
        case "E":
        case "N":
          it[change.path[i]] = change.rhs;
          break;
      }
    } else {
      switch ( change.kind ) {
        case "A":
          applyArrayChange(arr[index], change.index, change.item);
          break;
        case "D":
          arr = arrayRemove(arr, index);
          break;
        case "E":
        case "N":
          arr[index] = change.rhs;
          break;
      }
    }
    return arr;
  }

  function applyDiff ( target, source, filter ) {
    if ( target && source ) {
      var onChange = function ( change ) {
        if (!filter || filter(target, source, change)) {
          console.log("onChange", change);
          applyChange(target, source, change);
        }
      };
      deepDiff(target, source, onChange);
    }
  }

  accumulateDiff.applyDiff = applyDiff;
}());
