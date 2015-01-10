"use strict";

var process = process || null;

var NetworkManager = function () {
    this.updateTime = 100; /* millis */

    this.lastUpdate = 0;
    this.port = (process && process.env && process.env.PORT) || 8080;
    this.ip = "0.0.0.0";

    this.masterSocket = null;
    this.socket = null;
    this.sockets = [];
    this.updateQueue = {};
    this.scores = {};
    this.buffer = [];
    this.pendingDeaths = [];
};


NetworkManager.port = (process && process.env && process.env.PORT) || 8080;


NetworkManager.EventTypes = {
    Spellcast: 0,
    ObjectInfo: 1
};

NetworkManager.prototype.connect = function (masterSocket, socket) {
    if (!masterSocket) {
        this.socket = socket;
    }
    else {
        this.sockets.push(socket);
        this.masterSocket = masterSocket;
    }

    socket.on("update", this.handleUpdate.bind(this));
    socket.on("death", this.handleDeath.bind(this));
    socket.on("scores", this.handleScores.bind(this));
    socket.on("next-round", this.handleNextRound.bind(this));
};

NetworkManager.prototype.addSpellcast = function (spellName, target, caster) {
    this.buffer.push({
        t: NetworkManager.EventTypes.Spellcast, /* EventType */
        data: {spellName: spellName, target: target, caster: caster}
    });
};

NetworkManager.prototype.addObject = function (object, index) {
    var objectInfo = {
        position: object.position,
        velocity: object.velocity,
        target: object.target,
        score: object.score,
        id: index
    };

    this.buffer.push({t: NetworkManager.EventTypes.ObjectInfo, /* EventType */
                      data: objectInfo});
};

NetworkManager.prototype.flush = function (objectId) {
    if (this.buffer.length > 0) {
        if (!this.isServer()) {
            this.socket.emit("update", [{data: this.buffer, id: objectId}]);
        } else {
            this.masterSocket.emit("update", this.buffer);
        }
    }

    this.buffer = [];
};

NetworkManager.prototype.addObjectData = function (objects, playerCount) {
    for (var i = 0; i < playerCount; i++) {
        this.addCharacterInfo(objects[i], i);
    }
};

NetworkManager.prototype.handleUpdate = function (payload /*Array*/) {
    for (var i = 0; i < payload.length; i++) {
        if (!this.updateQueue[payload[i].id]) {
            this.updateQueue[payload[i].id] = [];
        }
        var data = payload[i].data;
        if (data !== undefined) {
            this.updateQueue[payload[i].id].push(data);
            if (this.isServer()) {
                if (payload[i].t === NetworkManager.EventTypes.Spellcast) {
                    this.recorder.onSpellcast(data.caster, data.spellName);
                }
            }
        }
    }
};

NetworkManager.prototype.handleDeath = function (data) {
    if (this.isServer()) {
        this.masterSocket.emit("death", data);
    }
    console.log("client death");
    this.pendingDeaths.push(data.index);
};

NetworkManager.prototype.getPendingDeaths = function () {
    return this.pendingDeaths;
};

NetworkManager.prototype.sendDie = function (playerIndex) {
    this.socket.emit("death", {index: playerIndex});
};

NetworkManager.prototype.sendScores = function (playerIndex, score) {
    if (this.isServer())
        this.masterSocket.emit("scores", {index: playerIndex, score: score});
};

NetworkManager.prototype.handleScores = function (data) {
    if (this.isServer()) {
        this.masterSocket.emit("scores", data);
    }
    this.events.scoresInfo.fire(this, data.score, data.index);
};


NetworkManager.prototype.sendNextRound = function () {
    this.socket.emit("next-round");
    console.log("next round send");
};

NetworkManager.prototype.handleNextRound = function () {
    this.events.nextRound.fire(this);
    if (this.isServer()) {
        this.masterSocket.emit("next-round");
    }
    console.log("next round received");
};


NetworkManager.prototype.getScores = function () {
    return this.scores;
};

NetworkManager.prototype.getLastUpdateFrom = function (objectId) {
    if (!this.updateQueue[objectId]) {
        return null;
    }
    return this.updateQueue[objectId].shift();
};

NetworkManager.prototype.isServer = function () {
    return this.masterSocket !== null;
};

NetworkManager.prototype.reset = function () {
    this.lastUpdate = 0;
    this.updateQueue = {};
    this.scores = {};
    this.buffer = [];
    this.pendingDeaths = [];
};

module.exports = NetworkManager;
