"use strict";
var Vector = require("./math/vector");

var ID_COUNTER = 0;

function copyProperties(object, description) {
    var copyableProperties = [
        "name", "health", "startingHealth", "speed", "movementFunction",
        "mass",
        "rotation",
        "castType", "range", "duration",
        "effects", "effectRadius", "damageAmount", "pushbackForce",
        "animations"
    ];

    for (var i = 0; i < copyableProperties.length; i++) {
        var prop = copyableProperties[i];
        if (description[prop] !== undefined) {
            object[prop] = description[prop];
        }
    }
}

var Character = function (sprite, description) {
    this.position = new Vector(210, 210);
    this.velocity = new Vector(0, 0);
    this.acceleration = new Vector(0, 0);
    this.rotation = 0;
    this.startingHealth = description.health;
    this.health = description.health;
    this.speed = description.speed || 100;
    this.score = 0;
    this.isDead = false;
    this.movementFunction = "linear";

    this.animations = description.animations;
    this.sprite = sprite;
    this.voice = description.voice;

    description.size = description.size || new Vector(64, 64);
    this.size = new Vector(description.size.x, description.size.y);

    this.collisionRadius = Math.max(this.size.x, this.size.y) / 2;

    copyProperties(this, description);
};


var Spell = function (sprite, description) {
    this.description = description.description;
    // physics
    this.position = new Vector();
    this.velocity = new Vector(0, 0);
    this.acceleration = new Vector(0, 0);
    this.initialVelocity = description.initialVelocity || 0;
    this.initialAcceleration = description.initialAcceleration || 0;
    this.movementFunction = description.movementFunction || "linear";
    this.frictionless = true;

    description.size = description.size || new Vector(64, 64);
    this.size = new Vector(description.size.x, description.size.y);
    this.collisionRadius = Math.max(this.size.x, this.size.y) / 2;

    // rendering
    this.sprite = sprite;
    this.icon = description.icon;
    this.rotation = 0;

    this.sfx = description.sfx;

    // stamps and stuff
    this.initialPosition = this.position.clone();
    this.timestamp = Date.now();

    this.cooldown = description.cooldown;

    this.id = ID_COUNTER++;

    copyProperties(this, description);
};

Character.prototype.clone = Spell.prototype.clone = function () {
    var clone = new this.constructor({}, {});
    clone.position = this.position.clone();
    clone.velocity = this.velocity.clone();
    clone.acceleration = this.acceleration.clone();
    clone.size = this.size.clone();
    clone.sprite = (this.sprite && this.sprite.clone()) || {};

    clone.collisionRadius = this.collisionRadius;
    clone.id = ID_COUNTER++;

    if (this.constructor == Spell) {
        clone.timestamp = Date.now();
        clone.initialPosition = this.position.clone();
    }

    copyProperties(clone, this);
    return clone;
};

Character.prototype.getCenter = Spell.prototype.getCenter = function () {
    return this.position.add(this.size.divide(2));
};

Character.prototype.playAnimation = function (action, forward) {
    var angle = Vector.right.angleTo360(forward);
    var animationOffset = 0;
    if (angle >= Math.PI / 4 && angle <  3 * Math.PI / 4) {
        animationOffset = 3;
    }
    else if (angle >= 3 * Math.PI / 4 && angle <  5 * Math.PI / 4) {
        animationOffset = 2;
    }
    else if (angle >= 5 * Math.PI / 4 && angle < 7 * Math.PI / 2) {
        animationOffset = 1;
    }
    else {
        animationOffset = 0;
    }
    this.sprite.activeAnimation = this.animations[action] + animationOffset;
};


module.exports.Character = Character;
module.exports.Spell = Spell;
