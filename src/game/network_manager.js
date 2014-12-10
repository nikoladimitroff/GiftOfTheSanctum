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
            this.socket.emit("update", {data: this.buffer, id: objectId});
        } else {
            // TODO: Currently not going here!
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
    if (this.isServer()) {
        if (!this.updateQueue[payload.id]) {
            this.updateQueue[payload.id] = [];
        }
        this.updateQueue[payload.id].push(payload.data);
    } else {
        for (var i = 0; i < payload.length; i++) {
            if (!this.updateQueue[payload[i].id]) {
                this.updateQueue[payload[i].id] = [];
            }
            if (payload[i].data !== undefined) {
                this.updateQueue[payload[i].id].push(payload[i].data);
            }
        }
    }
};

NetworkManager.prototype.handleDeath = function (data) {
    if (this.isServer()) {
        this.masterSocket.emit("death", data);
    }
    else {
        console.log("client death");
        this.pendingDeaths.push(data.index);
    }
};

NetworkManager.prototype.getPendingDeaths = function () {
    return this.pendingDeaths;
};


NetworkManager.prototype.sendDie = function (playerIndex /*,  objects */) {
    this.socket.emit("death", {index: playerIndex});
};

NetworkManager.prototype.handleScores = function (data) {
    if (this.masterSocket) {
        var payload = {index: data.index, score: data.score};
        this.masterSocket.emit("scores", payload);
    }
    else {
        console.log(data);
        this.scores[data.index] = {index: data.index, score: data.score};
    }
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

module.exports = NetworkManager;
