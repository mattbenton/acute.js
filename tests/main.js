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
  user: {
    name: "Matthew Pee Bentballs { money | currency }",
    dob: new Date()
  },
  money: 3245.234,
  greeting: "Hi my name is, { user.name | eval }!"
};

function init () {
  acute.enableLog();
  // acute.log("init", model);

  // view = acute.view(document.getElementById("app"), model);
  // scope = view.scope;

  // scope = new acute.Scope(model);

  // scope.watch("greeting", function ( change ) {
  //   console.log(change);
  // });

  // inst = acute.interpolate("Left## { @greeting } ##Right", scope);

  // console.log(inst);

 /* var evalFn = acute.parser.parse("greeting | eval");
  console.log(evalFn);

  var w = { name: "w" };

  console.log(evalFn(scope, w));

  console.log(w);
*/
  console.log(acute.parser.parse("{ i18n.minimumPurchase | if offer.minimumPurchase | eval }{ i18n.noMinimumPurchase | if !offer.minimumPurchase }"));
  // console.log(acute.parser.parse("{ name : 2, gf: { name: 'Decca', 'ag-\\'e': age } }"));
  // console.log(acute.parser.parse("offer.expires | date 2, 3, 4,"));
  // console.log(acute.parser.parse("offer.expires | date { name: 2, age: bob, name: fred, age: 234, 'people': \"matt\" } | bold"));
  // console.log(acute.parser.parse("offer.expires | date { name: 2, age: age }"));
}

if ( !/internet explorer/i.test(navigator.appName) ) {
  if ( window.init ) init();
}
