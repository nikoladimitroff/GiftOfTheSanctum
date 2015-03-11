"use strict";
var Loggers = require("../utils/logger");
var networking = require("./networking_objects.js");

var LobbyNetworker = function () {
    this.sockets = [];
    this.rooms = {};
    this.players = {};

    this.masterSocket = null;
};

LobbyNetworker.prototype.start = function (io, socket) {
    this.sockets.push(socket);
    this.masterSocket = io;

    socket.emit("connected", {message: "Hi"});
    socket.on("getRoom", this.getRoom.bind(this, socket));
    socket.on("getPlayer", this.getPlayer.bind(this, socket));
    socket.on("disconnect", this.handleDisconnect.bind(this, socket));
};

LobbyNetworker.prototype.firstFreeRoom = function () {
    for (var roomId in this.rooms) {
        if (this.rooms[roomId].isFree()) {
            return this.rooms[roomId];
        }
    }
};

LobbyNetworker.prototype.getPlayer = function (socket, data) {
    if (data && data.playerName) {
        var player = new networking.Player(socket.id, data.playerName);
        this.players[player.id] = player;
        player.azureId = data.azureId;

        var payload = {mainSocketId: player.id, playerName: player.name};
        socket.emit("getPlayer", payload);
    }
};

LobbyNetworker.prototype.getRoom = function (socket, data) {
    if (data && data.playerId && this.players[data.playerId]) {
        var freeRoom = this.firstFreeRoom();
        var room = freeRoom || new networking.Room(this.masterSocket);
        this.rooms[room.id] = this.rooms[room.id] || room;
        this.players[data.playerId].roomId = room.id;

        room.handleRoom();

        socket.emit("getRoom", {roomId: room.id});
    }
};

LobbyNetworker.prototype.handleDisconnect = function (socket) {
    if (this.players[socket.id]) {
        var roomId = this.players[socket.id].roomId;
        var room = this.rooms[roomId];
        if (!room.game) {
            return;
        }

        room.game.disconnectCount = (room.game.disconnectCount + 1) || 1;
        if (room.game.disconnectCount >= room.game.playerCount) {
            Loggers.Debug.log("deleting room");
            delete this.rooms[roomId];
        }
    }
};

module.exports = LobbyNetworker;
