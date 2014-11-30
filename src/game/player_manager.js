"use strict";

var PlayerManager = function (characters, physicsManager) {
    this.characters = characters;
    this.physics = physicsManager;
};

PlayerManager.prototype.update = function () {
};

PlayerManager.prototype.moveTo = function (player, target) {
    player.target = target.clone();
    delete player.coefficients;
};

module.exports = PlayerManager;
