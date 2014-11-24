"use strict";
var NetworkManager = require("../game/network_manager");

var Client = function() {
    this.socket = null;
    this.playerId = null;
    this.playerName = null;
    this.roomId = null;
}

Client.prototype.start = function() {
	this.socket = io.connect("", { port: NetworkManager.port, transports: ["websocket"] });

	this.load("src/game_client/main.html");
}

Client.prototype.load = function(path) {
    $("#content").load(path);
}

var client;

window.onload = function() {
    client = new Client();
    client.start();
}