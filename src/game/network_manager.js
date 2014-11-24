"use strict";
var sanctum = require("./all_sanctum") || sanctum;

sanctum = sanctum || {};

sanctum.EventTypes = {
    Spellcast: 0,
    ObjectInfo: 1
};

var process = process || null;

sanctum.NetworkManager = function () {
    this.updateTime = 100; /* millis */

    this.lastUpdate = 0;
    this.port = (process && process.env && process.env.PORT) || 8080;
    this.ip = "0.0.0.0";

    this.masterSocket = null;
    this.socket = null;
    this.sockets = [];
    this.updateQueue = [];
    this.scores = {};
    this.buffer = [];
    this.pendingDeaths = [];
};


sanctum.NetworkManager.port = (process && process.env && process.env.PORT) || 8080;

sanctum.NetworkManager.prototype.connect = function(masterSocket, socket) {
    if(!masterSocket) {
        this.socket = socket;
    } else {
        this.sockets.push(socket);
        this.masterSocket = masterSocket;
    }

    socket.on("update", this.handleUpdate.bind(this));
    socket.on("death", this.handleDeath.bind(this));
    socket.on("scores", this.handleScores.bind(this));
}

sanctum.NetworkManager.prototype.addSpellcast = function(spellName, target, caster) {
    this.buffer.push({t/*EventType*/: sanctum.EventTypes.Spellcast,
                        data: {spellName: spellName, target: target, caster: caster}});
}

sanctum.NetworkManager.prototype.addObject = function(object, index) {
    var objectInfo = {
        position: object.position,
        velocity: object.velocity,
        target: object.target,
        score: object.score,
        id: index
    };

    this.buffer.push({t/*EventType*/: sanctum.EventTypes.ObjectInfo,
                        data: objectInfo});
}

sanctum.NetworkManager.prototype.flush = function() {
    if(this.buffer.length > 0) {
        if(!this.masterSocket) {
            this.socket.emit("update", this.buffer);
        } else {
            this.masterSocket.emit("update", this.buffer);
        }
    }

    this.buffer = [];
}

sanctum.NetworkManager.prototype.addObjectData = function(objects, playerCount) {
    for(var i = 0; i < playerCount; i++) {
        this.addCharacterInfo(objects[i], i);
    }
}

sanctum.NetworkManager.prototype.handleUpdate = function(payload /*Array*/) {
    this.updateQueue.push(payload);
}

sanctum.NetworkManager.prototype.handleDeath = function(data) {
    if(this.masterSocket) {
        this.masterSocket.emit("death", data);
    } else {
        console.log("client death");
        this.pendingDeaths.push(data.index);
    }
}

sanctum.NetworkManager.prototype.getPendingDeaths = function() {
    return this.pendingDeaths;
}

sanctum.NetworkManager.prototype.sendDie = function(playerIndex, objects) {
    this.socket.emit("death", {index: playerIndex});
}

sanctum.NetworkManager.prototype.handleScores = function(data) {
    if(this.masterSocket) {
        this.masterSocket.emit("scores", {index: data.index, score: data.score});
    } else {
        console.log(data);
        this.scores[data.index] = {index: data.index, score: data.score};
    }
}

sanctum.NetworkManager.prototype.getScores = function() {
    return this.scores;
}

sanctum.NetworkManager.prototype.getLastUpdate = function() {
    return this.updateQueue.shift();
}

sanctum.NetworkManager.prototype.isServer = function() {
    return this.masterSocket != null;
}

if(typeof module != "undefined" && module.exports) {
    module.exports = sanctum.NetworkManager;
}
