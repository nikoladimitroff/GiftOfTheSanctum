var Vector = require("../../../src/game/math/vector");
var should = require("chai").should();

describe("Vector", function () {
    it("static members", function () {
        Vector.zero.x.should.equal(0);
        Vector.zero.y.should.equal(0);
        Vector.up.x.should.equal(0);
        Vector.up.y.should.equal(1);
        Vector.down.x.should.equal(0);
        Vector.down.y.should.equal(-1);
        Vector.right.x.should.equal(1);
        Vector.right.y.should.equal(0);
        Vector.left.x.should.equal(-1);
        Vector.left.y.should.equal(0);
    });
    
    it("#add", function () {
        Vector.right.add(Vector.up).equals(Vector.one).should.be.true;
        var result = new Vector();
        Vector.add(Vector.right, Vector.left, result);
        result.equals(Vector.zero).should.be.true;
    });
    
    it("#set", function () {
        var v = new Vector();
        v.set(123, -321);
        v.x.should.equal(123);
        v.y.should.equal(-321);
    });
});