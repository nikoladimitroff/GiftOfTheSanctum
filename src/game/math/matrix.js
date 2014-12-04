"use strict";
var Vector = require("./vector");

var Matrix = function (m11, m12, m13, m21, m22, m23) {
    this.m11 = m11 || 0;
    this.m12 = m12 || 0;
    this.m13 = m13 || 0;
    this.m21 = m21 || 0;
    this.m22 = m22 || 0;
    this.m23 = m23 || 0;
};

Matrix.prototype = {
    multiply: function (m) {
        if (m instanceof Matrix)
            return new Matrix(this.m11 * m.m11 + this.m12 * m.m21,
                              this.m11 * m.m12 + this.m12 * m.m22,
                              this.m11 * m.m13 + this.m12 * m.m23 + this.m13,
                              this.m21 * m.m11 + this.m22 * m.m21,
                              this.m21 * m.m12 + this.m22 * m.m22,
                              this.m21 * m.m13 + this.m22 * m.m23 + this.m23);
        else
            throw new Error("Scalar multiplication not implemented!");

    },
    transform: function (v) {
        return new Vector(this.m11 * v.x + this.m12 * v.y + this.m13,
                          this.m21 * v.x + this.m22 * v.y + this.m23);
    },
    invert: function () {
        var inverseDet = 1 / (this.m11 * this.m22 - this.m12 * this.m21);

        var cofactor13 = this.m12 * this.m23 - this.m13 * this.m22,
            cofactor23 = -(this.m11 * this.m23 - this.m13 * this.m21);

        return new Matrix(this.m22 * inverseDet,
                          -this.m12 * inverseDet,
                          cofactor13 * inverseDet,
                          -this.m21 * inverseDet,
                          this.m11 * inverseDet,
                          cofactor23 * inverseDet);
    },
    equals: function (m) {
        return this.m11 == m11 &&
               this.m12 == m12 &&
               this.m13 == m13 &&
               this.m21 == m21 &&
               this.m22 == m22 &&
               this.m23 == m23;
    },
    epsilonEquals: function (m, epsilon) {
        return Math.abs(this.m11 - m.m11) < epsilon &&
               Math.abs(this.m12 - m.m12) < epsilon &&
               Math.abs(this.m13 - m.m13) < epsilon &&
               Math.abs(this.m21 - m.m21) < epsilon &&
               Math.abs(this.m22 - m.m22) < epsilon &&
               Math.abs(this.m23 - m.m23) < epsilon;
    }
};

Matrix.fromRotation = function (angle) {
    var cos = Math.cos(angle),
        sin = Math.sin(angle);

    return new Matrix(cos, -sin, 0,
                      sin, cos, 0);
};


Matrix.fromTranslation = function (translation) {
    return new Matrix(1, 0, translation.x,
                      0, 1, translation.y);
};

module.exports = Matrix;
