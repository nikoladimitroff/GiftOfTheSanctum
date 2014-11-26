"use strict";
var Vector = require("./vector");
var steering = require("./steering");

var integrators = {};

integrators.Euler = function () {};
integrators.Euler.prototype.integrate = function (states, dt, friction) {
    for (var i = 0; i < states.length; i++) {
        var state = states[i];

        var friction = new Vector();
        if (!state.frictionless && state.velocity.length() != 0) /* disabled */ {
            var frictionCoefficient = 0.0003; // wood

            friction = state.acceleration.multiply(-1 * frictionCoefficient * state.mass);
            Vector.add(state.acceleration, friction, state.acceleration);
        }
        Vector.add(state.velocity, state.acceleration.multiply(dt), state.velocity);
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
}


module.exports = integrators;