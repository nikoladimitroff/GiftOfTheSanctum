var networking = require("./networking_objects.js");
var networkManager = require("./network_manager");

var Main = function() {
    this.sockets = [];
    this.rooms = {};
    this.players = {};

    this.masterSocket = null;
}

Main.prototype.firstFreeRoom = function() {
    for(var i = 0, length = this.rooms.length; i < length; i++) {
        if(this.rooms[i].isFree()) {
            return this.rooms[i];
        }
    }
}

Main.prototype.getPlayer = function(socket, data) {
    if(data && data.playerName) {
        var player = new networking.Player(data.playerName);
        this.players[player.id] = player;
        socket.emit("getPlayer", { playerId: player.id, playerName: player.name });
    }
}

Main.prototype.getRoom = function(socket, data) {
    if(data && data.playerId && this.players[data.playerId]) {
        var room = this.firstFreeRoom() || new networking.Room(this.masterSocket);
        this.rooms[room.id] = this.rooms[room.id] || room;
        this.players[data.playerId].roomId = room.id;
        room.players.push(this.players[data.playerId]);
        socket.emit("getRoom", { roomId: room.id });

        room.masterSocket.on("connection", function(socket) {
            console.log("connect to namespace");
            this.networkManager.connect(this.masterSocket, socket);
        }.bind(room));
    }
}

Main.prototype.start = function(io, socket) {
    this.sockets.push(socket);
    this.masterSocket = io;

    socket.emit("connected", { message: "Hi" });
    socket.on("getRoom", this.getRoom.bind(this, socket));
    socket.on("getPlayer", this.getPlayer.bind(this, socket));
}

module.exports = new Main();
