"use strict";

var PleaseWaitController = function () {
    this.client = null;
};

PleaseWaitController.prototype.init = function (client) {
    this.client = client;
    this.client.socket.emit("getRoom", {playerId: this.client.playerId});
};

module.exports = PleaseWaitController;
