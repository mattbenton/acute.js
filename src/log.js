/**
* Logging utilities
*/

var slice = Array.prototype.slice;

module.exports = function () {
  console.log.apply(console, slice.call(arguments));
};
