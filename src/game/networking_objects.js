"use strict";
var Loggers = require("../utils/logger");
var NetworkManager = require("./network_manager");
var Sanctum = require("./sanctum");

var networking = networking || {};
var MAX_PLAYERS = 8;

networking.token = function () {
    return Math.random().toString(36).substr(2);
};

networking.Player = function (id, name) {
    this.id = id;
    this.name = name;
    this.roomId = null;
};

networking.Player.prototype.extractTransferObject = function () {
    return {
        name: this.name
    };
};

networking.Room = function (masterSocket) {
    this.started = false;
    this.hostId = null;
    this.isRunning = false;
    this.id = networking.token();
    this.sockets = [];
    this.players = [];
    this.masterSocket = masterSocket;
    this.networkManager = new NetworkManager();

    this.game = null;

    this.roomSocket = this.masterSocket.of("/" + this.id);
};

networking.Room.prototype.startRoom = function () {
    if (!this.started) {
        this.roomSocket.on("connection", function (socket) {
            if (!this.hostId || this.players.length < 1) {
                this.hostId = socket.id;
            }

            socket.playerIndex = this.players.length;
            socket.contentLoaded = false;

            this.networkManager.connect(this.roomSocket, socket);
            socket.on("welcome", this.welcome.bind(this, socket));
            socket.on("leave", this.leave.bind(this, socket));
            socket.on("play", this.play.bind(this, socket));
            socket.on("chat", this.chat.bind(this, socket));
            socket.on("disconnect", this.leave.bind(this, socket));

        }.bind(this));

        this.started = true;
    }
};

networking.Room.prototype.findPlayer = function (id) {
    for (var i = 0; i < this.players.length; i++)
        if (this.players[i].id == id)
            return this.players[i];
};

networking.Room.prototype.welcome = function (socket, data) {
    if (data && data.socketId) {
        var player = new networking.Player(data.socketId, data.name);
        player.roomId = this.id;
        player.azureId = data.azureId;

        var isHost = this.hostId == data.socketId;
        socket.emit("welcome", {
            isHost: isHost,
            players: this.players,
            playerIndex: socket.playerIndex
        });

        this.sockets.push(socket);
        this.players.push(player);

        this.roomSocket.emit("join", {player: player.extractTransferObject()});
    }
};

networking.Room.prototype.chat = function (socket, data) {
    if (this.roomSocket.sockets.indexOf(socket) != -1) {
        this.roomSocket.emit("chat", data);
    }
};

networking.Room.prototype.leave = function (socket /*, data */) {
    var player = this.findPlayer(socket.id);

    if (socket && socket.id) {
        if (player) {
            this.removePlayer(player);
            this.removeSocket(socket);

            if (socket.id == this.hostId && this.players.length > 0) {
                this.hostId = this.players[0].id;
                this.sockets[0].emit("becomeHost");
            }

            this.roomSocket.emit("leave", {
                                        roomClosed: this.players.length === 0,
                                        name: player.name,
                                   });
        }
    }
};

networking.Room.prototype.play = function (socket) {
    if (socket.id === this.hostId) {
        Loggers.Debug.log("Game started.");
        this.isRunning = true;
        var playerData = this.players.map(function (p) {
            return {
                name: p.name,
                azureId: p.azureId,
                id: p.id
            };
        });
        this.game = Sanctum.startNewGame(playerData, -1, this.networkManager);
        this.roomSocket.emit("play", {});
    }
};

networking.Room.prototype.isFree = function () {
    return this.players.length < MAX_PLAYERS && !this.isRunning;
};

networking.Room.prototype.removePlayer = function (player) {
    var playerIndex = this.players.indexOf(player);

    if (playerIndex > -1) {
        this.players.splice(playerIndex, 1);
    }
};

networking.Room.prototype.removeSocket = function (socket) {
    var socketIndex = this.sockets.indexOf(socket);

    if (socketIndex > -1) {
        this.sockets.splice(socketIndex, 1);
    }
};

module.exports = networking;
