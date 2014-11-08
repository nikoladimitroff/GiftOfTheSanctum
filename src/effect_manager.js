var sanctum = sanctum || {};

var CastType = {
    projectile: "projectile",
    instant: "instant",
};

sanctum.EffectManager = function () {
    
};

sanctum.EffectManager.prototype.init = function (spellLibrary) {
    this.spellLibrary = spellLibrary;
    this.activeSpells = {};
}

sanctum.EffectManager.prototype.applyEffects = function (physics, objects) {
    var collisions = physics.getCollisionPairs(objects);
    for (var i = 0; i < collisions.length; i++) {
        var first = collisions[i].first,
            second = collisions[i].second;

        if (first instanceof sanctum.Character) {
        }
        
        if (second instanceof sanctum.Spell) {
            this.explodeSpell(second, physics, objects, first);
        }
    };
};

sanctum.EffectManager.prototype.explodeSpell = function (spell, physics, objects, hitTarget) {
    var targets = physics.getObjectsWithinRadius(objects,
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
    delete this.activeSpells[spell.id];
}

sanctum.EffectManager.prototype.castSpell = function (character, spellName, target, physics) {
    var spellInstance = this.spellLibrary[spellName].clone();
    this.activeSpells[spellInstance.id] = spellInstance;
    if (spellInstance.castType == CastType.projectile) {
        spellInstance.velocity = character.velocity.clone();
        
        var center = character.getSpriteCenter();
        var offset = new Vector(spellInstance.scale * spellInstance.sprite.frameWidth / 2,
                                spellInstance.scale * spellInstance.sprite.frameHeight / 2);
        var forward = target.subtract(center).normalized();
        
        var distance = spellInstance.collisionRadius + character.collisionRadius * 1.1;
        spellInstance.position = center.subtract(offset).add(forward.multiply(distance));
        
        spellInstance.acceleration = forward.multiply(100); // magic

        spellInstance.rotation = - Math.PI / 2 +  Vector.right.angleTo360(forward);
    }
    if (spellInstance.castType == CastType.instant) {
        this.activeSpells[spellInstance.id] = spellInstance;
        spellInstance.position = target.clone();
        spellInstance.position.x -= spellInstance.scale * spellInstance.sprite.frameWidth / 2;
        spellInstance.position.y -= spellInstance.scale * spellInstance.sprite.frameHeight / 2;
    }
    return spellInstance;
}

sanctum.EffectManager.prototype.applyPlatformEffect = function (physics, platform, objects, playerCount, center) {
    for (var i = 0; i < playerCount; i++) {
        var player = objects[i];
        if (!physics.circleIntersects(center, platform.radius, player.position, player.collisionRadius)) {
            player.health -= platform.outsideDamage;
        }
    }
}