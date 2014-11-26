"use strict";

var PlayerManager = function (characters, physicsManager) {
    this.characters = characters;
    this.physics = physicsManager;
};

PlayerManager.prototype.update = function () {
    for (var i = 0; i < this.characters.length; i++) {
        var character = this.characters[i];
    }
};

PlayerManager.prototype.moveTo = function (player, target) {
    player.target = target.clone();
    delete player.coefficients;
}

module.exports = PlayerManager;
