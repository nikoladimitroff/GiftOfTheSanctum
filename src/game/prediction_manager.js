"use strict";

var PredictionManager = function (player) {
    this.player = player;
    this.inputSequence = 0;
    this.inputs = [];
};

PredictionManager.prototype.addInput = function (data) {
    var input = {
        data: data,
        sequenceNumber: this.inputSequence++
    };

    this.inputs.push(input);
};

PredictionManager.prototype.verifyInput = function (/* input */) {
    // TODO: Verify that new position is close to previous
};

module.exports = PredictionManager;
