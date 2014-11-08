var sanctum = sanctum || {};

sanctum.PhysicsManager = function (friction) {
    this.integrator = new physics.EulerIntegrator();
    this.fixedStep = 1 / 60;
    this.friction = friction || 1;
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
        var firstCenter = new Vector(first.position.x + first.scale * first.sprite.frameWidth / 2,
                                     first.position.y + first.scale * first.sprite.frameHeight / 2);
        for (var j = i + 1; j < objects.length; j++) {
            var second = objects[j];
            var secondCenter = new Vector(second.position.x + second.scale * second.sprite.frameWidth / 2,
                                          second.position.y + second.scale * second.sprite.frameHeight / 2);
            
            
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
        var center = new Vector(obj.position.x + obj.scale * obj.sprite.frameWidth / 2,
                                obj.position.y + obj.scale * obj.sprite.frameHeight / 2);

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