var sanctum = sanctum || {};

sanctum.PhysicsManager = function () {
    this.integrator = new physics.EulerIntegrator();
}

sanctum.PhysicsManager.prototype.update = function (objects) {
    for (var i = 0; i < objects.length; i++) {
        this.integrator.integrate(objects[i]);
    }
};