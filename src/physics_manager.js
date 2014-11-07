var sanctum = sanctum || {};

sanctum.PhysicsManager = function () {
    this.integrator = new physics.EulerIntegrator();
    this.fixedStep = 1 / 60;
}

sanctum.PhysicsManager.prototype.update = function (objects) {
    this.integrator.integrate(objects, this.fixedStep);
};