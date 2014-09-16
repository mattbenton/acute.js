window.onerror = function ( errorMsg, url, lineNumber, column, errorObj ) {
  if ( errorObj ) {
    var error = errorObj.message;
    if ( errorObj.stack ) {
      error += "\nstack:\n" + errorObj.stack;
    }
    acute.log("error", error);
  } else {
    acute.log("error", errorMsg, url, lineNumber, column, errorObj);
  }
}

var model = {
  name: "Matthew Lee Benton",
  age: 26,
  gf: {
    name: "Decca Livia Fulton",
    age: 24
  },
  colors: [
    { name: "blue" },
    { name: "green" }
  ],
  view: 'offer',
  color: "Pooey Brown",
  update: function () {
    acute.log("hi");
    // model.colors.pop();
    // model.colors[1].name = "fred";
    model.colors.push({ name: "random color " + (Math.random() * 10) });
  },
  remove: function () {
    model.colors.pop();
  }
};

function init () {
  acute.enableLog();
  acute.log("init", model);

  // scope = new acute.Scope(model);
  // acute.log(scope);

  // var updateFn = function ( change ) {
  //   acute.log("change colors item", change);
  // };

  // scope.watch("colors", function ( info ) {
  //   acute.log(info);
  //   var changes = info.changes;
  //   if ( changes ) {
  //     for ( var i = 0, len = changes.length; i < len; i++ ) {
  //       var change = changes[i];
  //       acute.log(change);

  //       if ( change.type === "add" ) {
  //         scope.watch(change.path + ".name", updateFn);
  //       }
  //     }
  //   }
  // });


  // scope.watch("colors", function ( change ) {
  //   if ( change.changes ) {
  //     acute.log(JSON.stringify(change.changes, null, 2));
  //   }
  // });

  // model.age = model.gf;
  // scope = new acute.Scope(model);
  // scope.watch("canShowOffer", function ( change ) {
  //   acute.log("canShowOffer change", change);
  // });
  // scope.digest();

  view = acute.view(document.getElementById("app"), model);
  digest = function () {
    view.scope.digest();
  };
  scope = view.scope;
}

function parse ( expr ) {
  var transformed = acute.parser.transform(expr);
  acute.log(transformed.buffer);
}

function hideApp () {
  model.visible = !!!model.visible;
  view.scope.digest();
}

if ( !/internet explorer/i.test(navigator.appName) ) {
  if ( window.init ) init();
}
