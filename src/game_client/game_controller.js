"use strict";
var Sanctum = require("../game/sanctum");

var GameController = function () {
    this.client = null;
};

GameController.prototype.init = function (client) {
    this.client = client;

    var context = document.getElementById("game-canvas").getContext("2d");
    var viewmodel = this.client.viewmodel;
    var playerNames = viewmodel.players()
                            .map(function (player) { return player.name; });

    var options = {
        inEditor: false,
        autoresize: 1,
        debug: true
    };

    var game = Sanctum.startNewGame(playerNames,
                         this.client.findSelfIndex(),
                         this.client.networkManager,
                         viewmodel,
                         context,
                         options);

    game.events.gameOver
        .addEventListener(this.client.gameOver.bind(this.client));

};

module.exports = GameController;
