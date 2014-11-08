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
    this.handled = false;
    this.id = networking.token();
    this.players = [];
    this.masterSocket = masterSocket;
    this.networkManager = new NetworkManager();

    this.masterSocket = this.masterSocket.of("/" + this.id);
}

networking.Room.prototype.handleRoom = function(player) {
    if(!this.handled) {
        this.masterSocket.on("connection", function(socket) {
            this.networkManager.connect(this.masterSocket, socket);
            socket.on("welcome", this.welcome);
            socket.on("leave", this.leave.bind(this, socket));
            socket.on("play", function() {}.bind(this, socket));
            socket.on("disconnect", this.leave.bind(this, socket));
            socket.broadcast.emit("roomUpdated", { players: this.players } );
        }.bind(this));

        this.handled = true;
    }
}

networking.Room.prototype.findPlayer = function(id) {
    return this.players.filter(function(player) { return player.id == id }).pop();
}

networking.Room.prototype.welcome = function(data) {
    if(data && data.playerId) {
        var player = this.findPlayer(data.playerId);

        socket.emit("welcome", { message: "Welcome, " + 
            player.name, players: this.players });
    }
}

networking.Room.prototype.leave = function(socket, data) {
    if(this.masterSocket.sockets.indexOf(socket) == 0) {
        this.players = null;
        this.masterSocket.sockets.emit("leave", { roomClosed: true });
    } else if(this.masterSocket.sockets.indexOf(socket) > 0) {
        this.removePlayer(player);
        this.players = this.players.length == 0 ? null : this.players;
        socket.emit("leave", { roomClosed: this.players.length == 0, });
        socket.broadcast.emit("roomUpdated", { players: this.players } )
    }
}

networking.Room.prototype.play = function(socket) {
    console.log("Game started.");

    socket.emit("play", {});
    socket.broadcast.emit("play", {});
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