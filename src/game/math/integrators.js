"use strict";
var Vector = require("./vector");
var steering = require("./steering");

var integrators = {};

integrators.Euler = function () {};
integrators.Euler.prototype.integrate = function (states, dt, friction) {
    for (var i = 0; i < states.length; i++) {
        var state = states[i];

        if (!state.frictionless && state.velocity.length() !== 0) /* disabled */ {

            var frictionMagnitude = -1 * friction * state.mass;
            var frictionForce = state.acceleration.multiply(frictionMagnitude);
            Vector.add(state.acceleration, frictionForce, state.acceleration);
        }
        Vector.add(state.velocity,
                   state.acceleration.multiply(dt),
                   state.velocity);
        var movementVelocity = steering[state.movementFunction](state);
        var totalVelocity = state.velocity.add(movementVelocity).multiply(dt);
        state.totalVelocity = totalVelocity;
        Vector.add(state.position, totalVelocity, state.position);


        var epsilon = 10; // magic
        if (state.velocity.lengthSquared() <= epsilon * epsilon)
            state.velocity.set(0, 0);
        if (state.acceleration.lengthSquared() <= epsilon * epsilon)
            state.acceleration.set(0, 0);
    }
};

module.exports = integrators;
