/**
* App
*/

var defaultDirectives = {};
var defaultFilters = {};

function App ( name, rootElement ) {
  this.name = name;

  this.rootElement = rootElement || document.body;

  this.rootScope = new Scope();
  this.rootScope.$root = this.rootScope;
  this.rootScope.$app = this;

  this.directives = extend({}, defaultDirectives);
  this.filters = extend({}, defaultFilters);

  compile(this, this.rootScope, this.rootElement);
}

App.prototype.directive = function ( name, options ) {
  this.directives[name] = options;
};

acute.app = function ( name, rootElement ) {
  return new App(name, rootElement);
};
