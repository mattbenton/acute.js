/**
* Logging utilities
*/

var logNoOp = function () {};

acute.log = logNoOp;
acute.error = logNoOp;

acute.trace = {};

acute.traces = [
  {
    // enabled: true,
    name: "interplate",
    id: "i"
  },
  {
    enabled: true,
    name: "directive",
    id: "d"
  },
  {
    // enabled: true,
    name: "scope",
    id: "s"
  },
  {
    enabled: true,
    name: "parser",
    id: "p"
  }
];

acute.enableLog = function () {
  var console = window.console;
  var consoleLog = console && console.log;
  var consoleDebug = console && (console.debug || console.log);
  var consoleError = console && (console.error || console.log);

  if ( consoleLog ) {
    if ( Function.prototype.bind ) {
      // acute.log = consoleLog.bind(console);
      acute.log = Function.prototype.bind.call(consoleLog, console);
      acute.error = Function.prototype.bind.call(consoleError, console);
    } else if ( consoleLog.apply ) {
      acute.log = function acuteLog () {
        consoleLog.apply(console, Array.prototype.slice.call(arguments));
      };
      acute.error = function acuteError () {
        consoleError.apply(console, Array.prototype.slice.call(arguments));
      };
    } else {
      acute.log = function acuteLog () {
        consoleLog(Array.prototype.slice.call(arguments).join(", "));
      };
      acute.error = function acuteError () {
        consoleError(Array.prototype.slice.call(arguments).join(", "));
      };
      acute.log("---------- acute log enabled --------");
    }

    for ( var i = 0, len = acute.traces.length; i < len; i++ ) {
      var info = acute.traces[i];
      acute.trace[info.id] = createTraceFn(info, console, consoleDebug);
    }
  }
};

acute.disableLog = function () {
  acute.log = logNoOp;
  acute.error = logNoOp;
  for ( var i = 0, len = acute.traces.length; i < len; i++ ) {
    acute.trace[acute.traces[i]] = logNoOp;
  }
};

function createTraceFn ( info, console, consoleDebug ) {
  if ( info.enabled ) {
    if ( Function.prototype.bind ) {
      return Function.prototype.bind.call(consoleDebug, console, "[acute:" + info.name + "]");
    } else if ( consoleDebug.apply ) {
      return function acuteTrace () {
        var args = Array.prototype.slice.call(arguments);
        args.unshift("[acute:" + info.name + "]");
        consoleDebug.apply(console, args);
      };
    } else {
      return function acuteTrace () {
        var args = Array.prototype.slice.call(arguments);
        args.unshift("[acute:" + info.name + "]");
        consoleDebug(args.join(", "));
      };
    }
  }
  return logNoOp;
}

acute.enableLog();
