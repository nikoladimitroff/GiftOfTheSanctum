"use strict";
var NetworkManager = require("../game/network_manager");
var Sanctum = require("../game/sanctum");

var Viewmodel = function () {
    this.players = ko.observableArray();
    this.chatMessages = ko.observableArray();
    this.avatars = [
        "archer.png", "knight.png", "mage.png", "monk.png",
        "necro.png", "orc.png", "queen.png", "rogue.png"
    ].map(function (fileName) {
        return "content/art/characters/lobby/" + fileName;
    });
    this.isHost = ko.observable(false);
};

var RoomController = function (client) {
    this.client = client;
    this.viewmodel = new Viewmodel();
};

RoomController.prototype.init = function () {
    this.client.socket.on("welcome", this.welcome.bind(this));
    this.client.socket.on("play", this.handlePlay.bind(this));
    this.client.socket.on("chat", this.handleChat.bind(this));
    this.client.socket.on("join", this.join.bind(this));
    this.client.socket.on("leave", this.leave.bind(this));
    this.client.socket.on("becomeHost", this.becomeHost.bind(this));

    this.client.socket.emit("welcome", {
        playerName: this.client.playerName,
        playerId: this.client.socket.io.engine.id
    });

    $(document).ready(function () {
        $("#startGame").on("click", function () {
            if (this.viewmodel.isHost()) {
                this.client.socket.emit("play");
            }
        }.bind(this));

        $("#leaveGame").on("click", function () {
            this.client.socket.emit("leave");
        }.bind(this));

        $("#chat_form").submit(function (e) {
            e.preventDefault();
            if ($("#chat_text").val() !== "") {
                var name = this.viewmodel.players()[this.findSelfIndex()].name;
                var message = $("#chat_text").val();

                $("#chat_text").val("");
                $("#chat_text").focus();
                console.log(this.client);
                this.client.socket.emit("chat", {
                    message: {
                        author: name,
                        message: message
                    }
                });
            }
        }.bind(this));

        ko.applyBindings(this.viewmodel, document.getElementById("lobby-ui"));
    }.bind(this));
};

RoomController.prototype.updateHost = function (data) {
    this.isHost = data.isHost;
    this.renderHost();
};

RoomController.prototype.handlePlay = function () {
    this.client.load("game_ui", function () {
        var networkManager = new NetworkManager();
        networkManager.connect(null, this.client.socket);
        var context = document.getElementById("game-canvas").getContext("2d");
        var playerNames = this.viewmodel.players()
                          .map(function (player) { return player.name; });
        var options = {
            inEditor: false,
            autoresize: 1,
            debug: true
        };
        Sanctum.startNewGame(playerNames,
                             this.findSelfIndex(),
                             networkManager,
                             this.viewmodel,
                             context,
                             options);
    }.bind(this));
};

RoomController.prototype.handleChat = function (data) {
    if (data && data.message) {
        this.viewmodel.chatMessages.push({
            author: data.message.author,
            message: data.message.message,
            timestamp: "[" + new Date().toLocaleTimeString() + "]"
        });
        $("#chat").scrollTop($("#chat")[0].scrollHeight);
    }
};

RoomController.prototype.leave = function (data) {
    this.viewmodel.players.remove(function (player) {
        return player.id == data.playerId;
    });
};

RoomController.prototype.join = function (data) {
    this.viewmodel.players.push(data.player);
};

RoomController.prototype.becomeHost = function (/* data */) {
    this.viewmodel.isHost(true);
};

RoomController.prototype.welcome = function (data) {
    for (var i = 0; i < data.players.length; i++) {
        this.viewmodel.players.push(data.players[i]);
    }
    this.viewmodel.isHost(data.isHost);
};

RoomController.prototype.findSelfIndex = function () {
    var players = this.viewmodel.players();
    for (var i = 0; i < players.length; i++) {
        if (players[i].id == this.client.socket.io.engine.id) {
            return i;
        }
    }

    return -1;
};

module.exports = RoomController;
