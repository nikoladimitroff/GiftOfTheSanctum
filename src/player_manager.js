var sanctum = sanctum || {};

sanctum.PlayerManager = function (characters) {
    this.characters = characters;
};

sanctum.PlayerManager.prototype.update = function () {
    for (var i = 0; i < this.characters.length; i++) {
        var character = this.characters[i];
        if (character.target) {
            var dist = character.getCenter().subtract(character.target).lengthSquared();
            if (dist < character.collisionRadius * character.collisionRadius) {
                character.target = null;
                character.velocity.set(0, 0);
            }
        }
    }
};



if(typeof module != "undefined" && module.exports) {
    module.exports = sanctum.PlayerManager;
}
