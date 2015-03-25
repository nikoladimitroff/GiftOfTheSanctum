"use strict";
var Vector = require("./math/vector");

var PredictionManager = function (characters, network) {
    this.characters = characters;
    this.network = network;
    this.inputSequence = 0;
    this.lastProcessedInput = null;
    this.lastProcessedInputNumber = 0;
    this.inputs = [];

    if (this.network.isServer()) {
        this.cleanupSocketListeners();
    }

    this.network.socket.on("input-verification",
                            this.handleInputVerification.bind(this));
};

PredictionManager.prototype.addInput = function (data) {
    var input = {
        data: data,
        sequenceNumber: this.inputSequence++
    };

    this.inputs.push(input);
};

PredictionManager.prototype.getLastProcessedInput = function () {
    return this.lastProcessedInput;
};

PredictionManager.prototype.getInputs = function () {
    return this.inputs;
};

PredictionManager.prototype.verifyInput = function (input, playerIndex) {
    var player = this.characters[playerIndex];
    var newPosition = new Vector(input.position.x, input.position.y);
    if (newPosition.subtract(player.position).length() < 60) { // Magic
        this.network.sendVerifiedInput(player.id,
                                       playerIndex,
                                       input.inputSequenceNumber);
    } else {
        input.position = player.position;
        input.velocity = player.velocity;
        this.network.sendVerifiedInput(player.id,
                                       playerIndex,
                                       -1,
                                       player.position);
    }
};

PredictionManager.prototype.handleInputVerification = function (data) {
    if (data.sequenceNumber === -1) {
        this.characters[data.playerIndex].position.set(data.recoveryPosition);
        this.inputs = [];

        return;
    }

    this.lastProcessedInputNumber = data.sequenceNumber;

    this.inputs = this.inputs.filter(function (item) {
        if (item == data.sequenceNumber) {
            this.lastProcessedInput = item;
        }
        return item.sequenceNumber > data.sequenceNumber;
    });
};

PredictionManager.prototype.replayInputs = function (player, input) {
    if (input.data) {
        this.position.set(input.data);
    }
};

PredictionManager.prototype.predictPlayerMovement = function (player,
                                                              event,
                                                              playerIndex) {
    if (event.data.id == playerIndex) {
        var lastVerifiedInput =
            this.getLastProcessedInput();
        var inputs = this.getInputs();
        if (lastVerifiedInput) {
            player.position.set(lastVerifiedInput);
        }
        inputs.forEach(this.replayInputs.bind(player));
    } else {
        var eventPositionCopy = new Vector();
        eventPositionCopy.set(event.data.position);

        // var differentTargets = (player.target && event.data.target) ? !(player.target.equals(event.data.target)) : true;
        var allowedPacketTimestamp = (Date.now() -
                event.data.timestamp) < 600; // Magic
        var abovePacketTimestamp = (Date.now() -
                event.data.timestamp) > 3000; // Magic

        var isClosePosition = eventPositionCopy
                .subtract(player.position).length() < 60; // Magic

        if ((abovePacketTimestamp) ||
            (allowedPacketTimestamp &&
            !isClosePosition)) {

            player.position.set(event.data.position);
        }
    }
};

PredictionManager.prototype.cleanupSocketListeners = function () {
    this.network.socket.removeAllListeners("input-verification");
};

module.exports = PredictionManager;
