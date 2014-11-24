"use strict";
var networking = require("./networking_objects.js");
var networkManager = require("./network_manager");

var Main = function() {
    this.sockets = [];
    this.rooms = {};
    this.players = {};

    this.masterSocket = null;
}

Main.prototype.firstFreeRoom = function() {
    for(roomId in this.rooms) {
        if(this.rooms[roomId].isFree()) {
            return this.rooms[roomId];
        }
    }
}

Main.prototype.getPlayer = function(socket, data) {
    if(data && data.playerName) {
        var player = new networking.Player(socket.id, data.playerName);
        this.players[player.id] = player;

        socket.emit("getPlayer", { playerId: player.id, playerName: player.name });
    }
}

Main.prototype.getRoom = function(socket, data) {
    if(data && data.playerId && this.players[data.playerId]) {
        var room = this.firstFreeRoom() || new networking.Room(this.masterSocket);
        this.rooms[room.id] = this.rooms[room.id] || room;
        this.players[data.playerId].roomId = room.id;

        room.handleRoom();

        socket.emit("getRoom", { roomId: room.id});
    }
}

Main.prototype.handleDisconnect = function(socket) {
    if(this.players[socket.id]) {
        var roomId = this.players[socket.id].roomId;
        var room = this.rooms[roomId];
        if(!room.game) {
            return;
        }

        room.game.disconnectCount = (room.game.disconnectCount + 1) || 1;
        if(room.game.disconnectCount >= room.game.playerCount) {
            console.log("deleting room");
            delete this.rooms[roomId];
        }
    }
}

Main.prototype.start = function(io, socket) {
    this.sockets.push(socket);
    this.masterSocket = io;

    socket.emit("connected", { message: "Hi" });
    socket.on("getRoom", this.getRoom.bind(this, socket));
    socket.on("getPlayer", this.getPlayer.bind(this, socket));
    socket.on("disconnect", this.handleDisconnect.bind(this, socket));
}

module.exports = new Main();
