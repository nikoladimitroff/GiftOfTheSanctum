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
    this.updateQueue = [];
    this.scores = {};
    this.buffer = [];
    this.pendingDeaths = [];
};


NetworkManager.port = (process && process.env && process.env.PORT) || 8080;


NetworkManager.EventTypes = {
    Spellcast: 0,
    ObjectInfo: 1
};

NetworkManager.prototype.connect = function(masterSocket, socket) {
    if(!masterSocket) {
        this.socket = socket;
    } else {
        this.sockets.push(socket);
        this.masterSocket = masterSocket;
    }

    socket.on("update", this.handleUpdate.bind(this));
    socket.on("death", this.handleDeath.bind(this));
    socket.on("scores", this.handleScores.bind(this));
};

NetworkManager.prototype.addSpellcast = function(spellName, target, caster) {
    this.buffer.push({t/*EventType*/: NetworkManager.EventTypes.Spellcast,
                        data: {spellName: spellName, target: target, caster: caster}});
};

NetworkManager.prototype.addObject = function(object, index) {
    var objectInfo = {
        position: object.position,
        velocity: object.velocity,
        target: object.target,
        score: object.score,
        id: index
    };

    this.buffer.push({t/*EventType*/: NetworkManager.EventTypes.ObjectInfo,
                        data: objectInfo});
};

NetworkManager.prototype.flush = function() {
    if(this.buffer.length > 0) {
        if(!this.masterSocket) {
            this.socket.emit("update", this.buffer);
        } else {
            this.masterSocket.emit("update", this.buffer);
        }
    }

    this.buffer = [];
};

NetworkManager.prototype.addObjectData = function(objects, playerCount) {
    for(var i = 0; i < playerCount; i++) {
        this.addCharacterInfo(objects[i], i);
    }
};

NetworkManager.prototype.handleUpdate = function(payload /*Array*/) {
    this.updateQueue.push(payload);
};

NetworkManager.prototype.handleDeath = function(data) {
    if(this.masterSocket) {
        this.masterSocket.emit("death", data);
    } else {
        console.log("client death");
        this.pendingDeaths.push(data.index);
    }
};

NetworkManager.prototype.getPendingDeaths = function() {
    return this.pendingDeaths;
};

NetworkManager.prototype.sendDie = function(playerIndex, objects) {
    this.socket.emit("death", {index: playerIndex});
};

NetworkManager.prototype.handleScores = function(data) {
    if(this.masterSocket) {
        this.masterSocket.emit("scores", {index: data.index, score: data.score});
    } else {
        console.log(data);
        this.scores[data.index] = {index: data.index, score: data.score};
    }
};

NetworkManager.prototype.getScores = function() {
    return this.scores;
};

NetworkManager.prototype.getLastUpdate = function() {
    return this.updateQueue.shift();
};

NetworkManager.prototype.isServer = function() {
    return this.masterSocket != null;
};

module.exports = NetworkManager;
