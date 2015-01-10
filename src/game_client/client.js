"use strict";
var HelperModule = require("../utils/ui_helper");
var UIHelper = new HelperModule();
var NetworkManager = require("../game/network_manager");
var AzureManager = require("./azure_manager");

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

var Client = function () {
    this.viewmodel = new Viewmodel();
    this.socket = null;
    this.gameSocket = null;
    this.playerId = null;
    this.playerName = null;
    this.roomId = null;
};

Client.prototype.start = function () {
    this.socket = io.connect("", {
        port: NetworkManager.port,
        transports: ["websocket"]
    });

    this.initializeEventHandlers();
    this.goToStartScreen();
};

Client.prototype.initializeEventHandlers = function () {
    this.socket.on("getPlayer", function (data) {
        this.playerId = data.playerId;
        this.playerName = data.playerName;

        this.goToWaitingScreen();
    }.bind(this));

    this.socket.on("getRoom", function (data) {
        this.roomId = data.roomId;

        var payload = {port: NetworkManager.port};
        this.gameSocket = io.connect("/" + this.roomId, payload);
        this.initializeGameEventHandlers();

    }.bind(this));
};

Client.prototype.initializeGameEventHandlers = function () {
    this.gameSocket.on("connect", function () {
        this.goToLobbyScreen();
    }.bind(this));

    this.gameSocket.on("welcome", this.welcome.bind(this));
    this.gameSocket.on("play", this.startGame.bind(this));
    this.gameSocket.on("join", this.join.bind(this));
    this.gameSocket.on("leave", this.leave.bind(this));
    this.gameSocket.on("becomeHost", this.becomeHost.bind(this));
};

Client.prototype.welcome = function (data) {
    for (var i = 0; i < data.players.length; i++) {
        this.viewmodel.players.push(data.players[i]);
    }
    this.viewmodel.isHost(data.isHost);
};

Client.prototype.leave = function (data) {
    this.viewmodel.players.remove(function (player) {
        return player.id == data.playerId;
    });
};

Client.prototype.join = function (data) {
    this.viewmodel.players.push(data.player);
};

Client.prototype.becomeHost = function (/* data */) {
    this.viewmodel.isHost(true);
};

Client.prototype.findSelfIndex = function () {
    var players = this.viewmodel.players();
    for (var i = 0; i < players.length; i++) {
        if (players[i].id == this.gameSocket.io.engine.id) {
            return i;
        }
    }

    return -1;
};

Client.prototype.doNormalLogin = function (name) {
    this.socket.emit("getPlayer", {playerName: name});
};

Client.prototype.doAzureLogin = function () {
    var azureController = new AzureManager();
    azureController.login();
};

Client.prototype.goToStartScreen = function () {
    UIHelper.loadPage("login", null, this);
};

Client.prototype.goToWaitingScreen = function () {
    UIHelper.loadPage("please_wait", null, this);
};

Client.prototype.goToLobbyScreen = function () {
    UIHelper.loadPage("room", null, this);
};

Client.prototype.startGame = function () {
    UIHelper.loadPage("game", null, this);
};

window.onload = function () {
    var client = new Client();
    client.start();
};
