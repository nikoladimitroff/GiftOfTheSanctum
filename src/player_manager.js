var sanctum = sanctum || {};

sanctum.PlayerManager = function (characters, physicsManager) {
    this.characters = characters;
    this.physics = physicsManager;
};

sanctum.PlayerManager.prototype.update = function () {
    for (var i = 0; i < this.characters.length; i++) {
        var character = this.characters[i];
    }
};

sanctum.PlayerManager.prototype.moveTo = function (player, target) {
    player.target = target.clone();
    delete player.coefficients;
    //player.velocity = target.subtract(player.size.divide(2)).subtract(player.position);
    //Vector.normalize(player.velocity);
    //Vector.multiply(player.velocity, player.speed, player.velocity);   
}


if(typeof module != "undefined" && module.exports) {
    module.exports = sanctum.PlayerManager;
}
