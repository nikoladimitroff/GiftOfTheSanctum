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
    this.integrator.integrate(objects, this.fixedStep, this.friction);
};

function Pair(first, second) {
    this.first = first;
    this.second = second;
}

sanctum.PhysicsManager.prototype.getCollisionPairs = function (objects) {
    this.collisions = [];
    for (var i = 0; i < objects.length; i++) {
        var first = objects[i];
        var firstCenter = first.getCenter();
        for (var j = i + 1; j < objects.length; j++) {
            var second = objects[j];
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
    Vector.add(object.acceleration, force.divide(object.mass), object.acceleration);
}


sanctum.PhysicsManager.prototype.circleIntersects = function (center1, radius1, center2, radius2) {
    var distance = center1.subtract(center2).length();
    var radiusSum = radius1 + radius2;
    return distance <= radiusSum;
}

if(typeof module != "undefined" && module.exports) {
    module.exports = sanctum.PhysicsManager;
}