"use strict";
var Vector = require("./math/vector");

var PredictionManager = function (characters, network) {
    this.characters = characters;
    this.network = network;
    this.inputSequence = 0;
    this.lastProcessedInput = null;
    this.lastProcessedInputNumber = 0;
    this.inputs = [];

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

PredictionManager.prototype.verifyAndFilterInput = function (input,
                                                             playerIndex) {
    var player = this.characters[playerIndex];
    var newPosition = new Vector(input.position.x, input.position.y);
    if (newPosition.subtract(player.position).length() < 20) { // Magic
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

module.exports = PredictionManager;
