// var app = acute.app("app", document.getElementById("#app"));
// var rs = app.rootScope;
// rs.user = {
//   name: "Matt",
//   age: 26
// };
// rs.$digest();

// setTimeout(function () {
//   // rs.user.name = "Decca";
//   // rs.$digest();
// }, 1000);

// var model = {
//   name: "Matthew Benton",
//   age: 26,
//   gf: {
//     // name: "Decca Fulton",
//     name: function () {
//       acute.log("exec");
//       return "bob";
//     },
//     colors: [
//       "red",
//       "green"
//     ]
//   }
// };

// function init () {
  // acute.enableLog();
  // acute.bind(document.getElementById("app"), model);

  // acute.log(model);

  // model.$update("show", true);
// }

if ( !/internet explorer/i.test(navigator.appName) ) {
  document.getElementById("init-button").style.display = "none";
  if ( window.init ) init();
}

window.onerror = function ( errorMsg, url, lineNumber, column, errorObj ) {
  acute.log("error", errorMsg, url, lineNumber, column, errorObj);
}

// var expr = acute.parseExpr('"My name is " + gf.name()')(model);
// acute.log(expr);

// model.$update("name", "Bobby");
