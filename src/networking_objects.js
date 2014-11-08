var NetworkManager = require("./network_manager");

var networking = networking || {};
var MAX_PLAYERS = 8;

networking.token = function() {
    return Math.random().toString(36).substr(2);
}

networking.Player = function(name) {
    this.id = name + networking.token();
    this.name = name;
    this.roomId = null;
}

networking.Room = function(masterSocket) {
    this.id = networking.token();
    this.players = [];
    this.masterSocket = masterSocket;
    this.networkManager = new NetworkManager();

    this.masterSocket = this.masterSocket.of("/" + this.id);
}

networking.Room.prototype.isFree = function() {
        return this.players.length < MAX_PLAYERS;
}

networking.Room.prototype.removePlayer = function(player) {
    var playerIndex = this.players.indexOf(player)

    if(playerIndex > -1) {
        this.players.splice(playerIndex)
    }
}

module.exports = networking;