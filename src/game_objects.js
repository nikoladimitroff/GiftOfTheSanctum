var sanctum = sanctum || {};

var ID_COUNTER = 0;

function copyProperties(object, description) {
    var copyableProperties = [
        "name",
        "mass",
        "rotation",
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
    
    this.animations = description.animations;
    this.scale = description.scale || 1;
    
    this.collisionRadius = this.scale * Math.max(sprite.frameWidth, sprite.frameHeight) / 2;
    
    copyProperties(this, description);
};

sanctum.Spell = function (sprite, description) {
    this.position = new Vector(300, 300);
    this.velocity = new Vector(0, 0);
    this.acceleration = new Vector(0, 0);
    this.sprite = sprite;
    this.rotation = 0;
    this.frictionless = true;
    this.sprite.activeAnimation = 0;
    
    this.scale = description.scale || 1;

    this.collisionRadius = this.scale * Math.max(sprite.frameWidth, sprite.frameHeight) / 2;
    
    this.id = ID_COUNTER++;
    
    copyProperties(this, description);    
}

sanctum.Character.prototype.clone = sanctum.Spell.prototype.clone = function () {
    var clone = new this.constructor({}, {});
    clone.position = this.position.clone();
    clone.velocity = this.velocity.clone();
    clone.acceleration = this.acceleration.clone();
    clone.sprite = this.sprite.clone();
    
    clone.scale = this.scale;

    clone.collisionRadius = this.collisionRadius;
    clone.id = ID_COUNTER++;
    
    copyProperties(clone, this);    
    return clone;
}
 sanctum.Character.prototype.getSpriteCenter = sanctum.Spell.prototype.getSpriteCenter = function () {
    var center = this.position.clone();
    center.x += this.scale + this.sprite.frameWidth / 2;
    center.y += this.scale + this.sprite.frameHeight / 2;
    return center;
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