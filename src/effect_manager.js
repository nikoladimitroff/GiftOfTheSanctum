var sanctum = sanctum || {};

var CastType = {
    projectile: "projectile",
    instant: "instant",
};

sanctum.EffectManager = function () {
    this.spellCooldowns = [];
};

sanctum.EffectManager.prototype.init = function (spellLibrary, characters, platform) {
    this.spellLibrary = spellLibrary;

    this.characters = characters;
    this.platform = platform;
    this.activeSpells = [];
    this.spellCooldowns = characters.map(function () { return {}; });
};

sanctum.EffectManager.prototype.reset = function () {
    this.activeSpells = [];
    this.spellCooldowns = this.characters.map(function () { return {}; });
};

sanctum.EffectManager.prototype.removeSpell = function (spellId, index) {
    if (index !== undefined && this.activeSpells[index].id == spellId) {
        this.activeSpells[index] = this.activeSpells[this.activeSpells.length - 1];
        this.activeSpells.pop();
        return true;
    }
    
    for (var i = 0; i < this.activeSpells.length; i++) {
        if (this.activeSpells[i].id == spellId) {
            this.activeSpells[i] = this.activeSpells[this.activeSpells.length - 1];
            this.activeSpells.pop();
            return true;
        }
    }
    return false;
};

sanctum.EffectManager.prototype.applyEffects = function (physics, dt) {
    var collisions = physics.getCollisionPairs(this.characters, this.activeSpells);
    for (var i = 0; i < collisions.length; i++) {
        var first = collisions[i].first,
            second = collisions[i].second;

        if (first instanceof sanctum.Character &&
            second instanceof sanctum.Spell) {
            this.pulseSpell(second, physics, first, dt);
        }
    };
};

sanctum.EffectManager.prototype.pulseSpell = function (spell, physics, hitTarget, dt) {
	if (spell.castingType == CastType.instant) {
		spell.lastUpdate = (spell.lastUpdate + dt) || dt;
		if (spell.lastUpdate <= 1000) { // magic
			return;
		}
	}
	

    var targets = physics.getObjectsWithinRadius(this.characters,
                                                 spell.position,
                                                 spell.effectRadius);
    if (targets.length == 0)
        targets.push(hitTarget);

    for (var i = 0; i < targets.length; i++) {
        var target = targets[i];
        for (var j = 0; j < spell.effects.length; j++) {
            var effect = spell.effects[j];
            switch (effect) {
                case 'damage':
                    target.health -= spell.damageAmount;
                    break;
                case 'pushback':
                    var hitDirection = target.position.subtract(spell.position);
                    Vector.normalize(hitDirection);
                    Vector.multiply(hitDirection, spell.pushbackForce, hitDirection);
                    physics.applyForce(target, hitDirection);
                    target.target = null;
                    break;
            };
        }
    }
    if (spell.castType == CastType.projectile)
        this.removeSpell(spell.id);
}

sanctum.EffectManager.prototype.castSpell = function (characterId, spellName, target, physics) {
    var timeSinceLastCast = Date.now() - this.spellCooldowns[characterId][spellName]; 
    if (timeSinceLastCast <= this.spellLibrary[spellName].cooldown) {
        return null;
    }

    var character = this.characters[characterId];
    var spellInstance = this.spellLibrary[spellName].clone();
    if (spellInstance.castType == CastType.projectile) {
        
        var center = character.getCenter();
        var offset = spellInstance.size.divide(2);
        var forward = target.subtract(center).normalized();
        
        var distance = (spellInstance.collisionRadius + character.collisionRadius) * 1.1;
        spellInstance.position = center.subtract(offset).add(forward.multiply(distance));        
        spellInstance.acceleration = forward.multiply(this.spellLibrary[spellName].startingAcceleration);
        spellInstance.velocity = character.velocity.add(forward.multiply(this.spellLibrary[spellName].startingVelocity));

        spellInstance.rotation = - Math.PI / 2 +  Vector.right.angleTo360(forward);
    }
    if (spellInstance.castType == CastType.instant) {
		var isInRange = this.spellLibrary[spellName].range > target.subtract(character.getCenter()).length();
		if (!isInRange)
			return null;
        spellInstance.position = target.subtract(spellInstance.size);
    }
    this.activeSpells.push(spellInstance);
    
    this.spellCooldowns[characterId][spellName] = Date.now();
    spellInstance.casterId = characterId;
    return spellInstance;
}

sanctum.EffectManager.prototype.applyPlatformEffect = function (physics) {
    var center = this.platform.size.divide(2);
    for (var i = 0; i < this.characters.length; i++) {
        var player = this.characters[i];
        if (!physics.circleIntersects(center, this.platform.radius, player.position, player.collisionRadius)) {
            player.health -= this.platform.outsideDamage;
        }
    }
}

sanctum.EffectManager.prototype.cleanupEffects = function () {
    var now = Date.now();
    for (var i = 0; i < this.activeSpells.length; i++) {
        var object = this.activeSpells[i];
        
        if (object instanceof sanctum.Spell) {
            var spell = object;
            var removeInstantSpell = spell.castType == CastType.instant &&
                                     now - spell.timestamp >= object.duration;
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
    }
}

if(typeof module != "undefined" && module.exports) {
    module.exports = sanctum.EffectManager;
}
