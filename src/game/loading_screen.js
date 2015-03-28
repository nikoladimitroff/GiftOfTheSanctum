"use strict";

var Renderer = require("./renderer");
var Camera = require("./camera");
var Vector = require("./math/vector");
var Action = require("./enums").Action;

function MovingDots(amount, msPerUpdate) {
    this.max = amount + 1;
    this.current = 0;
    this.msPerUpdate = msPerUpdate;
    this.timeSinceLastUpdate = 0;
}

MovingDots.prototype.update = function (delta) {
    this.timeSinceLastUpdate += delta;
    if (this.timeSinceLastUpdate >= this.msPerUpdate) {
        this.current = (this.current + 1) % this.max;
        this.timeSinceLastUpdate = 0;
    }
};

MovingDots.prototype.toString = function () {
    return new Array(this.current + 1).join(".");
};

function getYOffset(index, player, extraOffset) {
    extraOffset = extraOffset || 0;
    return -1 * ((index + 1) % 2) * (player.size.y + extraOffset);
}

function LoadingScreen(players,
                       currentPlayer,
                       background,
                       loadingProgress,
                       canvas) {

    this.players = players;
    this.currentPlayer = currentPlayer;
    this.background = background;
    this.dots = new MovingDots(3, 500);
    this.loadingProgress = loadingProgress;
    this.renderer = new Renderer(canvas.getContext("2d"), false, 1);
    var size = new Vector(canvas.width, canvas.height);
    this.renderer.init(new Camera(new Vector(), size));

    this.savedSizes = [];
    var startingPositionX = canvas.width / 3;
    var startingPositionY = canvas.height / 2;
    var positionX = startingPositionX;
    var proximityCoeff = 0.8;
    for (var i = 0; i < players.length; i++) {
        if (i === currentPlayer) {
            var offsetX = proximityCoeff * players[i].size.x *
                         (players.length - 1.5) / 2;
            players[i].position.x = startingPositionX + offsetX;
            var offsetY = players[i].size.y * 1.5;
            players[i].position.y = startingPositionY + offsetY;
        }
        else {
            players[i].position.x = positionX;
            players[i].position.y = startingPositionY +
                                    getYOffset(i, players[i]);
            positionX += players[i].size.x * proximityCoeff;
        }
        players[i].playAnimation(Action.walk, Vector.up);
        this.savedSizes[i] = players[i].size.clone();
    }

    this.previousTime = 0;
    this.loop = this.render.bind(this);
    this.animationFrameId = requestAnimationFrame(this.loop);
}

LoadingScreen.prototype.render = function (/* timestamp */) {
    var delta = 1000 / 30;
    this.renderer.render(delta, [this.players], this.background, false);
    for (var i = 0; i < this.players.length; i++) {
        var progress = this.loadingProgress[i];
        var textX = this.players[i].position.x +
                    this.players[i].size.x / 2;
        var extraOffset = 20; // Magic
        var textY = this.players[i].position.y -
                    getYOffset(i + 1, this.players[i]) + extraOffset;
        if (i === this.currentPlayer) {
            textY = this.players[i].position.y +
                    this.players[i].size.y + extraOffset;
        }
        var textPos = new Vector(textX, textY);
        this.renderer.renderText((progress * 100).toFixed(0) + "%",
                                 textPos,
                                 "white",
                                 undefined,
                                 true);
        this.players[i].size = this.savedSizes[i].multiply(progress);
    }
    this.dots.update(delta);
    this.renderer.renderText("Marching towards the tower" + this.dots,
                             new Vector("center", -50),
                             "white",
                             "32px Segoe UI",
                             true);
    this.animationFrameId = requestAnimationFrame(this.loop);
};

LoadingScreen.prototype.destroy = function () {
    for (var i = 0; i < this.players.length; i++) {
        this.players[i].size = this.savedSizes[i];
    }
    cancelAnimationFrame(this.animationFrameId);
};

module.exports = LoadingScreen;
