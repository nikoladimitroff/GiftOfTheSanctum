"use strict";

var Vector = require("./math/vector");
var Character = require("./game_objects").Character,
    Spell = require("./game_objects").Spell;

var CastType = {
    projectile: "projectile",
    instant: "instant",
};

var effectsMap = {
    damage: function (target, spell) {
        target.health -= spell.damageAmount;
    },

    pushback: function (target, spell, physics, isServer) {
        if (isServer) {
            return;
        }
        var hitDirection = target.position.subtract(spell.position);
        Vector.normalize(hitDirection);
        Vector.multiply(hitDirection,
                        spell.pushbackForce,
                        hitDirection);
        physics.applyForce(target, hitDirection);
        target.target = null;
    }
};

var EffectManager = function () {
    this.spellCooldowns = [];
};

EffectManager.prototype.init = function (spellLibrary, characters, platform) {
    this.spellLibrary = spellLibrary;

    this.characters = characters;
    this.platform = platform;
    this.activeSpells = [];
    this.spellCooldowns = characters.map(function () { return {}; });
};

EffectManager.prototype.reset = function () {
    this.activeSpells = [];
    this.spellCooldowns = this.characters.map(function () { return {}; });
};

EffectManager.prototype.removeSpell = function (spellId, index) {
    var last = this.activeSpells[this.activeSpells.length - 1];
    if (index !== undefined && this.activeSpells[index].id == spellId) {
        this.activeSpells[index] = last;
        this.activeSpells.pop();
        return true;
    }

    for (var i = 0; i < this.activeSpells.length; i++) {
        if (this.activeSpells[i].id == spellId) {
            this.activeSpells[i] = last;
            this.activeSpells.pop();
            return true;
        }
    }
    return false;
};

EffectManager.prototype.applyEffects = function (physics, dt, isServer) {
    var collisions = physics.getCollisionPairs(this.characters,
                                               this.activeSpells);
    for (var i = 0; i < collisions.length; i++) {
        var first = collisions[i].first,
            second = collisions[i].second;

        if (first instanceof Character &&
            second instanceof Spell) {
            this.pulseSpell(second, physics, first, dt, isServer);
        }
    }
};

EffectManager.prototype.pulseSpell = function (spell, physics,
                                               hitTarget, dt, isServer) {
    if (spell.castingType == CastType.instant) {
        spell.lastUpdate = (spell.lastUpdate + dt) || dt;
        if (spell.lastUpdate <= 1000) { // magic
            return;
        }
    }


    var targets = physics.getObjectsWithinRadius(this.characters,
                                                 spell.position,
                                                 spell.effectRadius);
    if (targets.length === 0) {
        targets.push(hitTarget);
    }

    for (var i = 0; i < targets.length; i++) {
        var target = targets[i];
        for (var j = 0; j < spell.effects.length; j++) {
            var effect = spell.effects[j];
            var effectFunction = effectsMap[effect];

            if (effectFunction) {
                effectFunction(target, spell, physics, isServer);
            }
        }
    }
    if (spell.castType == CastType.projectile) {
        this.removeSpell(spell.id);
        if (this.audio) {
            this.audio.stop(spell.audioSfxId);
            var sfx = this.spellLibrary[spell.name].sfx.hit;
            this.audio.play(sfx);
        }
    }
};

EffectManager.prototype.castSpell = function (characterId, spellName, target) {
    var lastCast = this.spellCooldowns[characterId][spellName];
    var timeSinceLastCast = Date.now() - lastCast;
    if (timeSinceLastCast <= this.spellLibrary[spellName].cooldown) {
        return null;
    }

    var character = this.characters[characterId];
    var spell = this.spellLibrary[spellName].clone();
    if (spell.castType == CastType.projectile) {

        var center = character.getCenter();
        var offset = spell.size.divide(2);
        var forward = target.subtract(center).normalized();

        var radius = spell.collisionRadius + character.collisionRadius;
        spell.position = center.subtract(offset)
                         .add(forward.multiply(1.1 * radius)); // Magic
        spell.initialPosition = spell.position.clone();

        spell.rotation = -Math.PI / 2 + Vector.right.angleTo360(forward);
        spell.target = target.clone();
    }
    if (spell.castType == CastType.instant) {
        var distance = target.subtract(character.getCenter()).length();
        var isInRange = this.spellLibrary[spellName].range > distance;
        if (!isInRange)
            return null;
        spell.position = target.subtract(spell.size);
        spell.target = target;
    }
    this.activeSpells.push(spell);

    this.spellCooldowns[characterId][spellName] = Date.now();
    spell.casterId = characterId;
    if (this.audio) {
        var sfx = this.spellLibrary[spell.name].sfx.move;
        spell.audioSfxId = this.audio.play(sfx);
    }
    return spell;
};

EffectManager.prototype.applyPlatformEffect = function (physics) {
    var center = this.platform.size.divide(2);
    for (var i = 0; i < this.characters.length; i++) {
        var player = this.characters[i];
        var isOutsideOf = !physics.circleIntersects(center,
                                                    this.platform.radius,
                                                    player.position,
                                                    player.collisionRadius);
        if (isOutsideOf) {
            player.health -= this.platform.outsideDamage;
        }
    }
};

EffectManager.prototype.cleanupEffects = function () {
    var now = Date.now();
    for (var i = 0; i < this.activeSpells.length; i++) {
        var spell = this.activeSpells[i];
        var removeInstantSpell = spell.castType == CastType.instant &&
                                 now - spell.timestamp >= spell.duration;
        var pos = spell.position;
        var distanceTravelled = pos.subtract(spell.initialPosition).length();
        var outsideRange = spell.range > 0 && distanceTravelled >= spell.range;
        var outsideMap = pos.x < 0 || pos.x > this.platform.size.x ||
                         pos.y < 0 || pos.y > this.platform.size.y;
        var removeProjectileSpell = spell.castType == CastType.projectile &&
                                    (outsideMap || outsideRange);

        if (removeInstantSpell || removeProjectileSpell) {
            if (this.removeSpell(spell.id, i))
                i--;
        }
    }
};

EffectManager.prototype.update = function (delta, physics, platform, isServer) {
    this.applyEffects(physics, delta, isServer);
    this.applyPlatformEffect(physics, platform);
    this.cleanupEffects();
};

EffectManager.prototype.getSpellIcon = function (spellName) {
    return this.spellLibrary[spellName].icon;
};

EffectManager.prototype.getSpellDescription = function (spellName) {
    return this.spellLibrary[spellName].description;
};

EffectManager.prototype.getSpellDamage = function (spellName) {
    return this.spellLibrary[spellName].damageAmount || 0;
};

EffectManager.prototype.getSpellCooldown = function (spellName) {
    return this.spellLibrary[spellName].cooldown;
};

EffectManager.prototype.getSpellCoolingPercentage = function (characterId,
                                                               spellName) {
    if (this.spellCooldowns[characterId] === undefined ||
        this.spellCooldowns[characterId][spellName] === undefined) {
        return "";
    }

    var lastCast = this.spellCooldowns[characterId][spellName];
    var timeSinceLastCast = Date.now() - lastCast;
    var ratio = timeSinceLastCast / this.spellLibrary[spellName].cooldown;
    return Math.min(1, ratio);
};

EffectManager.prototype.getSpellRemainingCooldown = function (characterId,
                                                               spellName) {
    if (this.spellCooldowns[characterId] === undefined ||
        this.spellCooldowns[characterId][spellName] === undefined) {
        return "";
    }

    var lastCast = this.spellCooldowns[characterId][spellName];
    var timeSinceLastCast = Date.now() - lastCast;
    var cd = this.spellLibrary[spellName].cooldown;
    var remaining = (cd - timeSinceLastCast) / 1000;
    if (remaining < 0)
        return "";
    return remaining.toFixed(1);
};

module.exports = EffectManager;
