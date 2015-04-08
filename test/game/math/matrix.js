"use strict";
/* jshint expr: true */
var Matrix = require("../../../src/game/math/matrix");
var Vector = require("../../../src/game/math/vector");
var should = require("chai").should(); // jshint ignore: line

describe("Matrix", function () {
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

    describe("arithmetics", function () {
        it("#multiply", function () {
            var m1 = new Matrix(1, 2, 3,
                                3, 2, 1),
                m2 = new Matrix(4, 5, 6,
                                6, 5, 4);

            var expected = new Matrix(16, 15, 17,
                                      24, 25, 27);

            m1.multiply(m2).equals(expected).should.be.true;
        });

        it("#invert", function () {
            var m = new Matrix(1, 2, 3,
                               3, 2, 1);
            var expected = new Matrix(-0.5, 0.5, 1,
                                      0.75, -0.25, -2);

            m.invert().equals(expected).should.be.true;
        });

        it("#transform", function () {
            var m = new Matrix(1, 2, 3,
                               4, 5, 6);

            var v = new Vector(7, 8);
            var expected = new Vector(26, 74);

            m.transform(v).equals(expected).should.be.true;
        });

    });
});
