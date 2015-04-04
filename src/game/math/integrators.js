"use strict";
var Vector = require("./vector");
var steering = require("./steering");

var integrators = {};

integrators.Euler = function () {};
integrators.Euler.prototype.integrate = function (states, dt, friction) {
    for (var i = 0; i < states.length; i++) {
        var state = states[i];

        if (!state.frictionless) {
            var frictionMagnitude = -1 * friction * state.mass * dt *
                                     state.velocity.length();
            var frictionForce = state.acceleration.normalized()
                                     .multiply(frictionMagnitude);
            Vector.add(state.acceleration, frictionForce, state.acceleration);
        }
        // Linear damping
        Vector.multiply(state.acceleration, 0.95, state.acceleration); // magic
        Vector.multiply(state.velocity, 0.95, state.velocity); // magic
        Vector.add(state.velocity,
                   state.acceleration.multiply(dt),
                   state.velocity);
        var movementVelocity = steering[state.movementFunction](state);
        var totalVelocity = state.velocity.add(movementVelocity);
        state.totalVelocity = totalVelocity;
        Vector.add(state.position, totalVelocity.multiply(dt), state.position);

        var epsilon = 10; // magic
        if (state.velocity.lengthSquared() <= epsilon * epsilon)
            state.velocity.set(0, 0);
        if (state.acceleration.lengthSquared() <= epsilon * epsilon)
            state.acceleration.set(0, 0);
    }
};

module.exports = integrators;
