var Matrix = require("../../../src/game/math/matrix");
var Vector = require("../../../src/game/math/vector");
var should = require("chai").should();

describe("Vector", function () {
    describe("static methods", function () {
        it("#fromRotation", function () {
            var generated = Matrix.fromRotation(Math.PI / 3);
            var correct = new Matrix(1 / 2, -Math.sqrt(3) / 2, 0,
                                     Math.sqrt(3) / 2, 1 / 2, 0);

            generated.epsilonEquals(correct, 1e-6).should.be.true;
        });
        
        it("#fromTranslation", function () {
            var vec = new Vector(-0.1234567, 7654321);
            var generated = Matrix.fromTranslation(vec);
            var correct = new Matrix(1, 0, vec.x,
                                     0, 1, vec.y);

            generated.epsilonEquals(correct, 1e-6).should.be.true;
        });
    });
});