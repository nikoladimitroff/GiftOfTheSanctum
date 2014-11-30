"use strict";
var NetworkManager = require("../game/network_manager");
var AzureManager = require("./azure_manager");
var RoomController = require("./room_controller");

var Client = function () {
    this.socket = null;
    this.playerId = null;
    this.playerName = null;
    this.roomId = null;
};

Client.prototype.start = function () {
    this.socket = io.connect("", {
        port: NetworkManager.port,
        transports: ["websocket"]
    });
    this.goToStartScreen();
};

Client.prototype.load = function (path, callback) {
    $("#content").load(path, callback);
};

Client.prototype.goToStartScreen = function () {
    this.load("src/game_client/main.html", function () {
        $("#playButton").on("click", function () {
            var name = $("#name").val();
            this.socket.emit("getPlayer", {playerName: name});
        }.bind(this));

        $("#azureButton").on("click", function () {
            var azureController = new AzureManager();
            azureController.login();
            console.log("clicked");
        }.bind(this));

        $("#name").keydown(function (event) {
            if (event.keyCode == 13 /*Enter*/) {
                var name = $("#name").val();
                this.socket.emit("getPlayer", {playerName: name});
            }
        }.bind(this));

        this.socket.on("getPlayer", function (data) {
            this.playerId = data.playerId;
            this.playerName = data.playerName;

            this.goToWaitingScreen();
        }.bind(this));
    }.bind(this));
};


Client.prototype.goToWaitingScreen = function () {
    this.load("src/game_client/please_wait.html", function () {
        this.socket.on("getRoom", function (data) {
            this.roomId = data.roomId;

            var payload = {port: NetworkManager.port};
            this.socket = io.connect("/" + this.roomId, payload);

            this.socket.on("connect", function () {
                this.goToLobbyScreen();
            }.bind(this));
        }.bind(this));
        this.socket.emit("getRoom", {playerId: this.playerId});
    }.bind(this));
};

Client.prototype.goToLobbyScreen = function () {
    this.load("src/game_client/lobby.html", function () {
        this.roomController = new RoomController(this);
        this.roomController.init();
    }.bind(this));
};

window.onload = function () {
    var client = new Client();
    client.start();
};
