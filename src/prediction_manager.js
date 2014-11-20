var sanctum = require("./all_sanctum") || sanctum;

sanctum = sanctum || {};

sanctum.PredictionManager = function(player) {
	this.player = player;
	this.inputSequence = 0;
	this.inputs = [];
}

sanctum.PredictionManager.prototype.addInput = function(data) {
	var input = {
		data: data,
		sequenceNumber: this.inputSequence++
	};

	this.inputs.push(input);
}

sanctum.PredictionManager.prototype.verifyInput = function(input) {
	//TODO: Verify that new position is close to previous
}

if(typeof module != "undefined" && module.exports) {
    module.exports = sanctum.PredictionManager;
}