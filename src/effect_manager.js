var sanctum = sanctum || {};

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
    if (target instanceof Vector) {
        this.activeSpells[spellInstance.id] = spellInstance;
        spellInstance.velocity = character.velocity.clone();
        
        var force = target.subtract(character.position).normalized();
        Vector.multiply(force, 100, force);// magic
        spellInstance.acceleration = force;
        var forward = spellInstance.position.subtract(target).normalized();
        spellInstance.position = character.position.add(forward.multiply(-10)); // magic
        spellInstance.rotation = Vector.right.angleTo(forward);
    }
    return spellInstance;
}