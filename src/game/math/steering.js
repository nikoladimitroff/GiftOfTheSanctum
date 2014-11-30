"use strict";
var Vector = require("./vector");
var Matrix = require("./matrix");

var steering = {};
function tryStopMovement(obj) {
    var dist = obj.getCenter().subtract(obj.target).lengthSquared();
    var radius = obj.collisionRadius * 0.5;  /* magic */
    if (dist < radius * radius) {
        obj.target = null;
        return true;
    }
    return false;
}

steering.linear = function (obj) {
    if (obj.target) {
        if (tryStopMovement(obj)) return Vector.zero;

        var velocity = obj.target.subtract(obj.size.divide(2))
                       .subtract(obj.position);
        Vector.normalize(velocity);
        Vector.multiply(velocity, obj.speed, velocity);
        return velocity;
    }
    return Vector.zero;
};

steering.arrive = function (obj) {
    if (obj.target) {
        if (tryStopMovement(obj)) return Vector.zero;

        var toTarget = obj.target.subtract(obj.size.divide(2))
                       .subtract(obj.position);
        var dist = toTarget.length();

        var decelerationTweaker = 1.5; // magic
        var speed = dist / decelerationTweaker;
        speed = Math.min(speed, obj.speed);
        Vector.multiply(toTarget, speed / dist, toTarget);
        return toTarget;
    }
    return Vector.zero;
};


Math.sign = Math.sign || function (x) {
    return x / Math.abs(x) || 0;
};

function computeQuadraticCoefficients(obj) {
    var center = obj.getCenter();
    var toCenter = center.subtract(obj.target);
    var angle = Math.PI - Math.atan2(toCenter.y, toCenter.x);

    var rotation = Matrix.fromRotation(angle);
    var translation = Vector.lerp(rotation.transform(center),
                                  rotation.transform(obj.target),
                                  0.5);
    var totalTransform = rotation;
    totalTransform.m13 = -translation.x;
    totalTransform.m23 = -translation.y;

    var transformedCenter = totalTransform.transform(center),
        transformedTarget = totalTransform.transform(obj.target);

    var x1 = Math.min(transformedCenter.x, transformedTarget.x),
        x2 = Math.max(transformedCenter.x, transformedTarget.x);

    var inFirstQuadrant = angle >= 0 && angle < Math.PI / 2,
        inThirdQuadrant = angle >= Math.PI && angle < 3 * Math.PI / 2;
    var a = 2 * (inFirstQuadrant || inThirdQuadrant) - 1,
        b = (-x1 - x2) / a,
        c = x1 * x2 / a,
        scale = 1 / (x2 - x1),
        halfPlaneX = Math.sign(transformedTarget.x - transformedCenter.x);

    return {
        a: a,
        b: b,
        c: c,
        transform: totalTransform,
        scale: scale,
        halfPlaneX: halfPlaneX
    };
}

steering.quadratic = function (obj) {
    if (obj.target) {
        if (tryStopMovement(obj)) {
            delete obj.coeffiecients;
            return Vector.zero;
        }
        if (!obj.coefficients) {
            obj.coefficients = computeQuadraticCoefficients(obj);
        }

        var a = obj.coefficients.a,
            b = obj.coefficients.b,
            c = obj.coefficients.c,
            scale = obj.coefficients.scale,
            matrix = obj.coefficients.transform,
            halfPlaneX = obj.coefficients.halfPlaneX;

        var center = obj.getCenter();
        var transformedCenter = matrix.transform(center);
        var epsilon = 1;
        var x = transformedCenter.x + epsilon * halfPlaneX;
        var y = (a * x * x + b * x + c) * scale;
        var p = new Vector(x, y);
        var dir = matrix.invert().transform(p).subtract(center).normalized();

        return dir.multiply(obj.speed);
    }
    return Vector.zero;
};

module.exports = steering;
