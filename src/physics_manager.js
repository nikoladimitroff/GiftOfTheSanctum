var sanctum = require("./all_sanctum") || sanctum;

sanctum = sanctum || {};

var allPhysics = require("./physics");
var physics = physics || {};
var Vector = Vector || {};

if(allPhysics) {
    physics = allPhysics.physics || physics;
    Vector = allPhysics.Vector || Vector;
}

sanctum.PhysicsManager = function (friction) {
    this.integrator = new physics.EulerIntegrator();
    this.fixedStep = 1 / 60;
    this.friction = friction || 0.4;
    this.collisions = [];
}

sanctum.PhysicsManager.prototype.update = function (objects) {
//    var microsteps = 2;
//    for (var i = 0; i < microsteps; i++) {
//        this.integrator.integrate(objects, this.fixedStep / microsteps, this.friction);
//    }
    this.integrator.integrate(objects, this.fixedStep, this.friction);
};

function Pair(first, second) {
    this.first = first;
    this.second = second;
}

sanctum.PhysicsManager.prototype.getCollisionPairs = function (group1, group2) {
    this.collisions = [];
    for (var i = 0; i < group1.length; i++) {
        var first = group1[i];
        var firstCenter = first.getCenter();

        for (var j = 0; j < group2.length; j++) {
            var second = group2[j];

            var secondCenter = second.getCenter();
            var distance = firstCenter.subtract(secondCenter).length();
            var radiusSum = first.collisionRadius + second.collisionRadius;
                                   
            if (distance < radiusSum) 
                this.collisions.push(new Pair(first, second));
        }
    }
    return this.collisions;
};

sanctum.PhysicsManager.prototype.getObjectsWithinRadius = function (objects, point, radius) {
    if (radius == 0)
        return [];

    var neighbours = [];
    for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];
        
        var center = obj.position.add(obj.size.divide(2));
        var distance = center.subtract(point).length();
        var radiusSum = obj.collisionRadius + radius;
        if (distance < radiusSum) 
            neighbours.push(obj);
    }
    return neighbours;
}

sanctum.PhysicsManager.prototype.applyForce = function (object, force) {
    Vector.add(object.force, force, object.force);
}


sanctum.PhysicsManager.prototype.circleIntersects = function (center1, radius1, center2, radius2) {
    var distance = center1.subtract(center2).length();
    var radiusSum = radius1 + radius2;
    return distance <= radiusSum;
}

if(typeof module != "undefined" && module.exports) {
    module.exports = sanctum.PhysicsManager;
}