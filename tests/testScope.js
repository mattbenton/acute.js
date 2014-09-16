window.onerror = function ( errorMsg, url, lineNumber, column, errorObj ) {
  acute.log("error", errorMsg, url, lineNumber, column, errorObj);
}

// var model = acute.model({
//   name: "Matt",
//   age: 26,
//   visible: true,
//   gf: {
//     name: "Decca",
//     cat: {
//       name: "The Wedge"
//     }
//   }
// });

var model = {
  name: "Matt",
  age: 26,
  visible: true,
  gf: {
    name: "Decca",
    cat: {
      name: "The Wedge"
    }
  },
  colors: [
    { name: "green" },
    { name: "purple" }
  ]
};

function init () {
  acute.enableLog();
  acute.log("init!", model);


  var scope = window.scope = new acute.Scope(model);
  acute.log(scope);

  a = new acute.Scope(model.gf);

  scope.watch("name", changeFn);
  scope.watch("gf.name", changeFn);
  a.watch("name", changeFn);

  window.digest = function () {
    scope.digest();
    a.digest();
  };

  // scope.watch("name", changeFn);

  // scope.watch("gf", changeFn);
  // scope.watch("gf.name", changeFn);
  // scope.watch("gf.cat.name", changeFn);

  // scope.watch("name", function ( change ) {
  //   acute.log("changed name from '%s' to '%s'", change.lastValue, change.value, change);
  // });

  // scope.watch("age", changeFn);
  // scope.watch("gf.cat.name", changeFn);

  // scope.watch("colors", changeFn);

  // model.colors.pop();

  // scope.digest();

  // model.gf = 2;

  // scope.digest();

  // scope.monitor = [
  //   "name",
  //   "age",
  //   "gf",
  //   "gf.name",
  //   "gf.cat",
  // ];

  // acute.log(scope.get("gf.cat.name"));

  // model.$watch("*", changeFn);
  // model.$watch("gf", changeFn);

  // acute.bind(document.getElementById("app"), model);
}

function changeFn ( change ) {
  acute.log("changed", change);
}

function hideApp () {
  model.$set("visible", !!!model.visible);
}

if ( !/internet explorer/i.test(navigator.appName) ) {
  document.getElementById("init-button").style.display = "none";
  if ( window.init ) init();
}
