var chai = require("chai");
chai.use(require("chai-fuzzy"));
var expect = chai.expect;

require("./_spec");
var scope = require("../src/scope2");
var flatten = scope.flatten;
var expand = scope.expand;

describe("scope", function () {
  describe("#flatten()", function () {
    it("should work with primitives", function () {
      expect(flatten("Matt")).to.equal("Matt");
      expect(flatten(42)).to.equal(42);
      expect(flatten(0)).to.equal(0);
      expect(flatten(-4)).to.equal(-4);
      expect(flatten(3.14159)).to.equal(3.14159);
      expect(flatten(true)).to.equal(true);
      expect(flatten(false)).to.equal(false);
      expect(flatten(null)).to.equal(null);
    });

    it("should work with simple objects", function () {
      var model = {
        name: "Matt",
        age: 27
      };

      var expected = {
        "name": "Matt",
        "age": 27
      };

      expect(flatten(model)).to.be.like(expected);
    });

    it("should work with nested objects", function () {
      var model = {
        user: {
          name: "Matt",
          age: 27
        }
      };

      var expected = {
        "user.name": "Matt",
        "user.age": 27
      };

      expect(flatten(model)).to.be.like(expected);
    });

    it("should work with deeply nested objects", function () {
      var model = {
        user: {
          name: "Matt",
          age: 27,
          gf: {
            name: "Decca",
            age: 24
          }
        }
      };

      var expected = {
        "user.name": "Matt",
        "user.age": 27,
        "user.gf.name": "Decca",
        "user.gf.age": 24
      };

      expect(flatten(model)).to.be.like(expected);
    });
  });

  describe("#expand()", function () {
    it("should work with primitives", function () {
      expect(expand("Matt")).to.equal("Matt");
      expect(expand(42)).to.equal(42);
      expect(expand(0)).to.equal(0);
      expect(expand(-4)).to.equal(-4);
      expect(expand(3.14159)).to.equal(3.14159);
      expect(expand(true)).to.equal(true);
      expect(expand(false)).to.equal(false);
      expect(expand(null)).to.equal(null);
    });

    it("should work with simple objects", function () {
      var model = {
        "name": "Matt",
        "age": 27
      };

      var expected = {
        name: "Matt",
        age: 27
      };

      expect(expand(model)).to.be.like(expected);
    });

    it("should work with nested objects", function () {
      var model = {
        "user.name": "Matt",
        "user.age": 27
      };

      var expected = {
        user: {
          name: "Matt",
          age: 27
        }
      };

      expect(expand(model)).to.be.like(expected);
    });

    it("should work with deeply nested objects", function () {
      var model = {
        "user.name": "Matt",
        "user.age": 27,
        "user.gf.name": "Decca",
        "user.gf.age": 24
      };

      var expected = {
        user: {
          name: "Matt",
          age: 27,
          gf: {
            name: "Decca",
            age: 24
          }
        }
      };

      expect(expand(model)).to.be.like(expected);
    });

  });
});
