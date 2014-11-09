var sanctum = sanctum || {};

var CastType = {
    projectile: "projectile",
    instant: "instant",
};

sanctum.EffectManager = function () {
    
};

sanctum.EffectManager.prototype.init = function (spellLibrary, objects, platform) {
    this.spellLibrary = spellLibrary;
    this.objects = objects;
    this.platform = platform;
    this.activeSpells = {};
}

sanctum.EffectManager.prototype.removeSpell = function (spellId) {
    this.objects[this.activeSpells[spellId]] = this.objects[this.objects.length - 1];
    this.objects.pop();
    delete this.activeSpells[spellId];
}

sanctum.EffectManager.prototype.applyEffects = function (physics) {
    var collisions = physics.getCollisionPairs(this.objects);
    for (var i = 0; i < collisions.length; i++) {
        var first = collisions[i].first,
            second = collisions[i].second;

        if (first instanceof sanctum.Character) {
        }
        
        if (second instanceof sanctum.Spell) {
            this.pulseSpell(second, physics, first);
        }
    };
};

sanctum.EffectManager.prototype.pulseSpell = function (spell, physics, hitTarget) {
    var targets = physics.getObjectsWithinRadius(this.objects,
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
                case 'pushback':
                    var hitDirection = target.position.subtract(spell.position);
                    Vector.normalize(hitDirection);
                    Vector.multiply(hitDirection, spell.pushbackForce, hitDirection);
                    physics.applyForce(target, hitDirection);
                    break;
            };
        }
    }
    if (spell.castType == CastType.projectile)
        this.removeSpell(spell.id);
}

sanctum.EffectManager.prototype.castSpell = function (character, spellName, target, physics) {
    var spellInstance = this.spellLibrary[spellName].clone();
    if (spellInstance.castType == CastType.projectile) {
        spellInstance.velocity = character.velocity.clone();
        
        var center = character.getCenter();
        var offset = spellInstance.size.divide(2);
        var forward = target.subtract(center).normalized();
        
        var distance = (spellInstance.collisionRadius + character.collisionRadius) * 1.1;
        spellInstance.position = center.subtract(offset).add(forward.multiply(distance));        
        spellInstance.acceleration = forward.multiply(100); // magic

        spellInstance.rotation = - Math.PI / 2 +  Vector.right.angleTo360(forward);
    }
    if (spellInstance.castType == CastType.instant) {
        spellInstance.position = target.subtract(spellInstance.size);
    }
    this.objects.push(spellInstance);
    this.activeSpells[spellInstance.id] = spellInstance;
    return spellInstance;
}

sanctum.EffectManager.prototype.applyPlatformEffect = function (physics, playerCount) {
    var center = this.platform.size.divide(2);
    for (var i = 0; i < playerCount; i++) {
        var player = this.objects[i];
        if (!physics.circleIntersects(center, this.platform.radius, player.position, player.collisionRadius)) {
            player.health -= this.platform.outsideDamage;
        }
    }
}

sanctum.EffectManager.prototype.cleanupEffects = function (playerCount) {
    var now = Date.now();
    for (var i = playerCount; i < this.objects.length; i++) {
        var object = this.objects[i];
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
                this.removeSpell(spell.id);
                i--;
            }
        }
    }
}