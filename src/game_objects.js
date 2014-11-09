var sanctum = sanctum || {};

var ID_COUNTER = 0;

function copyProperties(object, description) {
    var copyableProperties = [
        "name", "health", 
        "mass",
        "rotation",
        "castType","range", "duration",
        "effects", "effectRadius", "damageAmount", "pushbackForce",
    ];
    
    for (var i = 0; i < copyableProperties.length; i++) {
        var prop = copyableProperties[i];
        if (description[prop] !== undefined) {
            object[prop] = description[prop];
        }
    }
}   

sanctum.Character = function (sprite, description) {
    this.position = new Vector(210, 210);
    this.velocity = new Vector(0, 0);
    this.acceleration = new Vector(0, 0);
    this.sprite = sprite;
    this.rotation = 0;
    this.health = description.health;
    
    this.animations = description.animations;
    this.size = new Vector(description.width, description.height);
    
    this.collisionRadius = Math.max(this.size.x, this.size.y) / 2;
    
    copyProperties(this, description);
};

sanctum.Spell = function (sprite, description) {
    // physics
    this.position = new Vector(300, 300);
    this.velocity = new Vector(0, 0);
    this.acceleration = new Vector(0, 0);
    this.frictionless = true;
    this.size = new Vector(description.width, description.height);
    this.collisionRadius = Math.max(this.size.x, this.size.y) / 2;
    
    // rendering
    this.sprite = sprite;
    this.rotation = 0;
    
    // stamps and stuff
    this.initialPosition = this.position.clone();
    this.timestamp = Date.now();

    
    this.id = ID_COUNTER++;
    
    copyProperties(this, description);    
}

sanctum.Character.prototype.clone = sanctum.Spell.prototype.clone = function () {
    var clone = new this.constructor({}, {});
    clone.position = this.position.clone();
    clone.velocity = this.velocity.clone();
    clone.acceleration = this.acceleration.clone();
    clone.size = this.size.clone();
    clone.sprite = this.sprite.clone();

    clone.collisionRadius = this.collisionRadius;
    clone.id = ID_COUNTER++;
    
    if (this.constructor == sanctum.Spell) {
        clone.timestamp = Date.now();
        clone.initialPosition = clone.position;
    }
    
    copyProperties(clone, this);    
    return clone;
}
 sanctum.Character.prototype.getCenter = sanctum.Spell.prototype.getCenter = function () {
    return this.position.add(this.size.divide(2));
};

sanctum.Character.prototype.playAnimation = function (action, forward) {
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
    console.log(animationOffset);
    this.sprite.activeAnimation = this.animations[action] + animationOffset;
};