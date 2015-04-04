"use strict";
var Vector = require("./math/vector");
var nowUTC = require("../utils/general_utils").nowUTC;

var Settings = {
    spellIconPath: "/content/art/spells/icons/",
    achievementIconPath: "/content/art/achievements/",
    imageFormat: ".png"
};

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

var DEFAULT_CHARACTER = {
    health: 600,
    speed: 150,
    size: new Vector(64, 64),
    mass: 1,
    animations: {
        walk: 8,
        spellcast0: 0,
        spellcast1: 0,
        spellcast2: 0,
        spellcast3: 0,
        spellcast4: 0,
        spellcast5: 0,
    },
    voice: {
        cast: "sounds/voices/laugh.mp3",
        move: "sounds/voices/where_shall_my_blood_be_spilled.mp3"
    },
};

var Character = function (sprite, description) {
    this.position = new Vector(210, 210);
    this.velocity = new Vector(0, 0);
    this.acceleration = new Vector(0, 0);
    this.rotation = 0;
    this.mass = description.mass || 1;
    this.startingHealth = this.health = description.health ||
                                        DEFAULT_CHARACTER.health;
    this.speed = description.speed || DEFAULT_CHARACTER.speed;
    this.score = 0;
    this.isDead = false;
    this.movementFunction = "linear";

    this.animations = description.animations || DEFAULT_CHARACTER.animations;
    this.sprite = sprite;
    this.voice = description.voice || DEFAULT_CHARACTER.voice;

    description.size = description.size || DEFAULT_CHARACTER.size;
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
    this.speed = description.speed || 100; // magic
    this.movementFunction = description.movementFunction || "linear";
    this.frictionless = true;

    description.size = description.size || new Vector(64, 64);
    this.size = new Vector(description.size.x, description.size.y);
    this.collisionRadius = Math.max(this.size.x, this.size.y) / 2;

    // rendering
    this.sprite = sprite;
    if (description.name) {
        var filename = description.name.toLowerCase().replace(/ /g, "_") +
                       Settings.imageFormat;
        this.icon = Settings.spellIconPath + filename;
    }
    this.rotation = 0;

    this.sfx = description.sfx;

    // stamps and stuff
    this.initialPosition = this.position.clone();
    this.timestamp = nowUTC();

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
        clone.timestamp = nowUTC();
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


var Achievement = function (description) {
    this.name = description.name;
    var filename = this.name.toLowerCase().replace(/ /g, "_") +
                   Settings.imageFormat;
    this.icon = Settings.achievementIconPath + filename;
    this.description = description.description;
    this.category = description.category;
     /* jshint ignore: start */
    this.requirements = new Function("game",
                                     "total",
                                     description.requirements);
     /* jshint ignore: end */
};

module.exports.Character = Character;
module.exports.Spell = Spell;
module.exports.Achievement = Achievement;
module.exports.Settings = Settings;
