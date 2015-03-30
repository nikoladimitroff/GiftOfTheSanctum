"use strict";

var PlayerManager = function (characters, physicsManager) {
    this.characters = characters;
    this.physics = physicsManager;
};

PlayerManager.prototype.update = function () {
};

PlayerManager.prototype.moveTo = function (player, destination) {
    player.destination = destination.clone();
    delete player.coefficients;
};

module.exports = PlayerManager;
