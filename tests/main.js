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
  // user: {
  //   name: "Matthew Pee Bentballs { money | currency }",
  //   dob: new Date()
  // },
  // money: 3245.234,
  // greeting: "Hi my name is, { user.name | eval }!",
  person: new Person("Matt")
};

function Person ( name ) {
  this.name = name;
}

Person.prototype.hi = function () {
  console.log("Hello, I am " + this.name);
};

function init () {
  // console.log(acute.parser.parse("person.hi()"));
  // console.log(acute.parser.parse("name || 2.34 + true / matt(3)"));
  // console.log(acute.parser.parse("{ i18n.minimumPurchase | if offer.minimumPurchase | eval }{ i18n.noMinimumPurchase | if !offer.minimumPurchase }"));
  // console.log(acute.parser.parse("{ name : 2, gf: { name: 'Decca', 'ag-\\'e': age } }"));
  // console.log(acute.parser.parse("offer.expires | date 2, 3, 4,"));
  // console.log(acute.parser.parse("offer.expires | date { name: 2, age: bob, name: fred, age: 234, 'people': \"matt\" } | bold"));
  // console.log(acute.parser.parse("offer.expires | date { name: 2, age: age }"));

  var view = acute.view(document.getElementById("app"), model);
}

if ( !/internet explorer/i.test(navigator.appName) ) {
  if ( window.init ) init();
}
