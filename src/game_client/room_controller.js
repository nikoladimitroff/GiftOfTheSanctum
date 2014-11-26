"use strict";
var NetworkManager = require("../game/network_manager");
var Sanctum = require("../game/sanctum");

var RoomController = function(client) {
    this.client = client;

    this.players = [];
    this.avatar_images = ["archer.png", "knight.png", "mage.png", "monk.png",
     "necro.png", "orc.png", "queen.png", "rogue.png"];
}

RoomController.prototype.init = function() {
    this.client.socket.on("roomUpdated", this.roomUpdated.bind(this));
    this.client.socket.on("welcome", this.updateHost.bind(this));
    this.client.socket.on("updateHost", this.updateHost.bind(this));
    this.client.socket.on("play", this.handlePlay.bind(this));
    this.client.socket.on("chat", this.handleChat.bind(this));

    this.client.socket.emit("welcome", {playerName: this.client.playerName, playerId: this.client.socket.io.engine.id});

    $(document).ready(function() {
        $("#startGame").on("click", function() {
            this.client.socket.emit("play");
        }.bind(this));

        $('#chat_form').submit(function(e) {
            e.preventDefault();
            var message = this.players[this.findSelfIndex()].name + ": " + $('#chat_text').val();
            if ($('#chat_text').val() != '') {
                $('#chat_text').val('');
                $('#chat_text').focus();
                console.log(this.client);
                this.client.socket.emit("chat", { message: message });
            }
        }.bind(this));
    }.bind(this));
}

RoomController.prototype.updateHost = function(data) {
    this.isHost = data.isHost;
    this.renderHost();
}

RoomController.prototype.handlePlay = function() {
    this.client.load("src/game_client/game_ui.html", function () {
        var networkManager = new NetworkManager();
        networkManager.connect(null, this.client.socket);
        Sanctum.startNewGame(this.players.map(function (c) { return c.name; }), 
                             this.findSelfIndex(), 
                             networkManager,
                             document.getElementById("game-canvas").getContext("2d"));
    }.bind(this));
}

RoomController.prototype.handleChat = function(data) {
    if (data && data.message) {
        $("#chat").append(data.message + "\n");
        $("#chat").scrollTol($("#chat")[0].scrollHeight);
    }
}

RoomController.prototype.roomUpdated = function(data) {
    this.players = data.players;

    var playersDisplayInfo = "<div class='players-column'>";

    for (var i = 0; i < this.players.length; i++) {
        playersDisplayInfo += "<div class='player-row'>" +
            "<img class='player-row-image' src='content/art/characters/lobby/"+ 
            this.avatar_images[i] + "'/>" + 
            "<div class='player-row-name'>" +
                this.players[i].name
            + "</div></div>";

        if (i == 3) {
            playersDisplayInfo += "</div><div class='players-column'>";
        }

    }

    playersDisplayInfo += "</div>";

    $(".players").html(playersDisplayInfo);
}

RoomController.prototype.findSelfIndex = function() {
    console.log(this.client.socket.io.engine.id);
    console.log(this.players);
    for (var i = 0; i < this.players.length; i++) {
        if (this.players[i].id == this.client.socket.io.engine.id) {
            return i;
        }
    }

    return -1;
}

RoomController.prototype.renderHost = function() {
    if (this.client.isHost) {
        $("#startGame").removeClass("disabled");
        $("#startGame").addClass("active");
    }
    else {
        $("#startGame").removeClass("active");
        $("#startGame").addClass("disabled");
    }   
}

module.exports = RoomController;