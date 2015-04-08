"use strict";
var HelperModule = require("./ui_helper");
var UIHelper = new HelperModule();
var NetworkManager = require("../game/network_manager");
var AzureManager = require("./azure_manager");
var UserState = require("../game/enums").UserState;

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
    this.isLoggedWithAzure = ko.observable(false);
};

global.Client = function () {
    this.viewmodel = new Viewmodel();
    this.azureManager = null;
    this.serverName = "/";
    this.userState = UserState.loginPage;
    // this.serverName =
    //   "https://enigmatic-savannah-1221.herokuapp.com/";
    this.socket = null;
    this.mainSocketId = null;
    this.gameSocket = null;
    this.gameSocketId = null;
    this.playerName = null;
    this.roomId = null;
    this.networkManager = null;
};

Client.prototype.start = function () {
    this.socket = io.connect(this.serverName, {
        port: NetworkManager.port,
        transports: ["websocket"]
    });

    this.initializeLoginEventHandlers();
    this.goToStartScreen();
};

Client.prototype.initializeLoginEventHandlers = function () {
    this.socket.on("getPlayer", function (data) {
        this.mainSocketId = data.mainSocketId;
        this.playerName = data.playerName;

        this.socket.emit("getRoom", {socketId: this.mainSocketId});
    }.bind(this));

    this.socket.on("getRoom", function (data) {
        this.roomId = data.roomId;

        var payload = {
            port: NetworkManager.port,
            transports: ["websocket"],
            "force new connection": true
        };
        this.gameSocket = io.connect(this.serverName + this.roomId, payload);
        this.initializeGameEventHandlers();

    }.bind(this));
};

Client.prototype.initializeGameEventHandlers = function () {
    this.gameSocket.on("connect", function () {
        this.userState = UserState.loby;
        this.gameSocketId = this.gameSocket.io.engine.id;
        this.goToRoomView();
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
    this.playerIndex = data.playerIndex;
};

Client.prototype.leave = function (data) {
    if (data.playerIndex == this.playerIndex) {
        this.reset();
        this.goToStartScreen();
    }
    this.viewmodel.players.remove(function (player) {
        return player.name == data.name; // TODO: Use some kind of ID but not SocketID!!
    });
    if (this.playerIndex > data.playerIndex) {
        this.playerIndex -= 1;
    }
};

Client.prototype.join = function (data) {
    var player = data.player;
    if (data.player.name === this.playerName) {
        player.id = this.gameSocketId;
    }
    this.viewmodel.players.push(data.player);
};

Client.prototype.becomeHost = function (/* data */) {
    this.viewmodel.isHost(true);
};

Client.prototype.findSelfIndex = function () {
    var players = this.viewmodel.players();
    for (var i = 0; i < players.length; i++) {
        if (players[i].id &&
            players[i].id === this.gameSocket.io.engine.id) {
            return i;
        }
    }

    return -1;
};

Client.prototype.endGame = function () {
    this.networkManager.resetGame();
    UIHelper.loadView("room", null, this);
};

Client.prototype.doNormalLogin = function (name) {
    if (this.userState == UserState.loginPage) {
        this.userState = UserState.gameMatching;
        this.socket.emit("getPlayer", {playerName: name});
    }
};

Client.prototype.doAzureLogin = function () {
    this.azureManager = this.azureManager || new AzureManager();
    var token = this.getAzureResult();
    this.azureManager.login(this.postAzureLogin.bind(this), token);
};

Client.prototype.postAzureLogin = function (result) {
    console.log("Azure post login: ", result, this);
    this.storeAzureResult(this.azureManager.client.currentUser);
    this.azureId = result.id;
    this.playerName = result.name;
    this.viewmodel.isLoggedWithAzure(true);
    this.socket.emit("getPlayer", {
        playerName: this.playerName,
        azureId: this.azureId
    });
};

Client.prototype.getAzureResult = function () {
    if (window.localStorage !== undefined &&
        window.localStorage.getItem("azureLoginData")) {
        return JSON.parse(window.localStorage.getItem("azureLoginData"));
    }
};

Client.prototype.storeAzureResult = function (token) {
    if (window.localStorage !== undefined) {
        window.localStorage.setItem("azureLoginData", JSON.stringify(token));
    }
};

Client.prototype.goToStartScreen = function () {
    UIHelper.loadView("login", null, this);
};

Client.prototype.goToWaitingScreen = function () {
    UIHelper.loadView("please_wait", null, this);
};

Client.prototype.goToRoomView = function () {
    UIHelper.loadView("room", null, this);
    this.networkManager = new NetworkManager();
    this.networkManager.connect(null, this.gameSocket);

    this.gameSocket.emit("welcome", {
        name: this.playerName,
        socketId: this.gameSocketId,
        azureId: this.azureId
    });
};

Client.prototype.goToAchievementsScreen = function () {
    UIHelper.loadView("achievements", null, this);
};

Client.prototype.startGame = function () {
    this.userState = UserState.playing;
    UIHelper.loadView("game", null, this);
};

Client.prototype.reset = function () {
    this.gameSocket.disconnect();
    this.networkManager.resetGame();

    this.userState = UserState.loginPage;
    this.viewmodel = new Viewmodel();
    this.gameSocket = null;
    this.gameSocketId = null;
    this.playerName = null;
    this.roomId = null;
    this.networkManager = null;
};

var loadGame = function () {
    var client = new Client();
    client.start();
};

window.onload = loadGame;
