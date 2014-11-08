var NetworkManager = require("./network_manager");

var networking = networking || {};
var MAX_PLAYERS = 8;

networking.token = function() {
    return Math.random().toString(36).substr(2);
}

networking.Player = function(id, name) {
    // this.id = name + networking.token();
    this.id = id;
    this.name = name;
    this.roomId = null;
}

networking.Room = function(masterSocket) {
    this.handled = false;
    this.id = networking.token();
    this.players = [];
    this.masterSocket = masterSocket;
    this.networkManager = new NetworkManager();

    this.masterSocket = this.masterSocket.of("/" + this.id);
}

networking.Room.prototype.handleRoom = function() {
    if(!this.handled) {
        this.masterSocket.on("connection", function(socket) {
            // console.log(socket.id);
            // console.log(this.parentSocket.sockets);

            this.networkManager.connect(this.masterSocket, socket);
            socket.on("welcome", this.welcome.bind(this, socket));
            socket.on("leave", this.leave.bind(this, socket));
            socket.on("play", function() {}.bind(this, socket));
            socket.on("disconnect", this.leave.bind(this, socket));

        }.bind(this));

        this.handled = true;
    }

}

networking.Room.prototype.findPlayer = function(id) {
    return this.players.filter(function(player) { return player.id == id }).pop();
}

networking.Room.prototype.welcome = function(socket, data) {
    if(data && data.playerId) {
        // var player = this.findPlayer(data.playerId);
        var player = new networking.Player(data.playerId, data.playerName);
        player.roomId = this.id;
        this.players.push(player);

        if(player) {
            socket.emit("welcome", { message: "Welcome, " + 
                player.name, players: this.players });

            this.masterSocket.emit("roomUpdated",
                { players: this.players } );
        }
    }
}

networking.Room.prototype.leave = function(socket, data) {
    var player = this.findPlayer(socket.id);

    if(socket && socket.id) {
        if(player) {
            this.removePlayer(player);
            
            this.masterSocket.emit("leave",
                { roomClosed: this.players.length == 0, });

            this.masterSocket.emit("roomUpdated",
                { players: this.players } );
        }
    }
}

networking.Room.prototype.play = function(socket) {
    console.log("Game started.");

    this.masterSocket.sockets.emit("play", {});
}

networking.Room.prototype.isFree = function() {
    return this.players.length < MAX_PLAYERS;
}

networking.Room.prototype.removePlayer = function(player) {
    var playerIndex = this.players.indexOf(player)

    if(playerIndex > -1) {
        this.players.splice(playerIndex, 1)
    }
}

module.exports = networking;