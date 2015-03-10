"use strict";

var Vector = require("./math/vector");
var integrators = require("./math/integrators");

var PhysicsManager = function (friction) {
    this.integrator = new integrators.Euler();
    this.fixedStep = 1 / 60;
    this.friction = friction || 0.0003; // wood
    this.collisions = [];
};

PhysicsManager.prototype.update = function (objects) {
    this.integrator.integrate(objects, this.fixedStep, this.friction);
};

function Pair(first, second) {
    this.first = first;
    this.second = second;
}

PhysicsManager.prototype.getCollisionPairs = function (group1, group2) {
    this.collisions = [];
    for (var i = 0; i < group1.length; i++) {
        var first = group1[i];
        var firstCenter = first.getCenter();

        for (var j = 0; j < group2.length; j++) {
            var second = group2[j];

            var secondCenter = second.getCenter();
            var distance = firstCenter.subtract(secondCenter).length();
            var radiusSum = first.collisionRadius + second.collisionRadius;

            if (distance < radiusSum) {
                this.collisions.push(new Pair(first, second));
            }
        }
    }
    return this.collisions;
};

PhysicsManager.prototype.getObjectsWithinRadius = function (objects,
                                                            point,
                                                            radius) {

    if (radius === 0)
        return [];

    var neighbours = [];
    for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];

        var center = obj.getCenter();
        var distance = center.subtract(point).length();
        var radiusSum = obj.collisionRadius + radius;
        if (distance < radiusSum)
            neighbours.push(obj);
    }
    return neighbours;
};

PhysicsManager.prototype.applyForce = function (object, force) {
    Vector.add(object.acceleration,
               force.divide(object.mass),
               object.acceleration);
};


PhysicsManager.prototype.circleIntersects = function (center1, radius1,
                                                      center2, radius2) {

    var distance = center1.subtract(center2).length();
    var radiusSum = radius1 + radius2;
    return distance <= radiusSum;
};

module.exports = PhysicsManager;
