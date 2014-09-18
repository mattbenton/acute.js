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
    name: "mattuew",
    dob: new Date()
  }
};

function init () {
  acute.enableLog();
  acute.log("init", model);

  view = acute.view(document.getElementById("app"), model);
  scope = view.scope;

  // console.log(acute.parser.parse("update(matt, fred, 2 + 2)"));
  // console.log(acute.parser.parse("{ name : 2, gf: { name: 'Decca', 'ag-\\'e': age } }"));
  // console.log(acute.parser.parse("offer.expires | date 2, 3, 4,"));
  // console.log(acute.parser.parse("offer.expires | date { name: 2, age: bob, name: fred, age: 234, 'people': \"matt\" } | bold"));
  // console.log(acute.parser.parse("offer.expires | date { name: 2, age: age }"));
}

if ( !/internet explorer/i.test(navigator.appName) ) {
  if ( window.init ) init();
}
