"use strict";
var Loggers = require("../utils/logger");
var process = process || null;

var NetworkManager = function () {
    this.updateTime = 100; // Magic /* millis */

    this.lastUpdate = 0;
    this.port = (process && process.env && process.env.PORT) || 8080;
    this.ip = "0.0.0.0";
    this.masterSocket = null;
    this.socket = null;
    this.sockets = {};

    this.updateQueue = {};
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
        this.gameSocketId = socket.io.engine.id;
        this.cleanupSocketListeners();
    } else {
        this.sockets[socket.id] = socket;
        this.masterSocket = masterSocket;
        this.socket = socket;
    }

    // Don't forget to add event to this.cleanupSocketListeners();
    socket.on("partly-content-loaded",
              this.handlePartlyContentLoaded.bind(this));
    socket.on("content-loaded", this.handleContentLoaded.bind(this));
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
        inputSequenceNumber: object.inputSequenceNumber,
        id: index,
        timestamp: Date.now()
    };

    this.buffer.push({t: NetworkManager.EventTypes.ObjectInfo, /* EventType */
                      data: objectInfo});
};

NetworkManager.prototype.flush = function (playerIndex) {
    if (this.buffer.length > 0) {
        if (!this.isServer()) {
            this.socket.emit("update", [{data: this.buffer, id: playerIndex}]);
        } else {
            this.masterSocket.emit("update", this.buffer);
        }
    }

    this.buffer = [];
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
                // I have no idea why this works the way it does
                // We need some serious refactoring
                for (var j = 0; j < data.length; j++) {
                    if (data[j].t === NetworkManager.EventTypes.Spellcast) {
                        this.recorder.onSpellcast(data[j].data.caster,
                                                  data[j].data.spellName);
                    }
                }
            }
        }
    }
};

NetworkManager.prototype.handleDeath = function (data) {
    if (this.isServer()) {
        this.masterSocket.emit("death", data);
    }
    Loggers.Debug.log("Client death: {0}", data.index);
    this.pendingDeaths.push(data.index);
};

NetworkManager.prototype.getPendingDeaths = function () {
    return this.pendingDeaths;
};

NetworkManager.prototype.sendDie = function (playerIndex) {
    this.masterSocket.emit("death", {index: playerIndex});
    this.pendingDeaths.push(playerIndex);
};

NetworkManager.prototype.sendScores = function (playerIndex, score) {
    if (this.isServer()) {
        this.events.scoresInfo.fire(this, score, playerIndex);
        this.masterSocket.emit("scores", {index: playerIndex, score: score});
    }
};

NetworkManager.prototype.sendVerifiedInput = function (socketId,
                                                       playerIndex,
                                                       sequenceNumber,
                                                       recoveryPosition) {
    this.sockets[socketId].emit("input-verification",
            {
                playerIndex: playerIndex,
                sequenceNumber: sequenceNumber,
                recoveryPosition: recoveryPosition
            }
    );
};

NetworkManager.prototype.handleScores = function (data) {
    this.events.scoresInfo.fire(this, data.score, data.index);
};


NetworkManager.prototype.sendNextRound = function () {
    this.socket.emit("next-round");
    Loggers.Debug.log("Next round send");
};

NetworkManager.prototype.sendContentLoaded = function () {
    if (!this.isServer()) {
        this.socket.emit("content-loaded", {socketId: this.gameSocketId});
    }
};

NetworkManager.prototype.sendPartlyContentLoaded = function (loaded,
                                                             needsToLoad) {
    if (!this.isServer()) {
        this.socket.emit("partly-content-loaded",
            {
                socketId: this.gameSocketId,
                loaded: loaded,
                needsToLoad: needsToLoad
            });
    }
};

NetworkManager.prototype.handleNextRound = function () {
    this.events.nextRound.fire(this);
    if (this.isServer()) {
        this.masterSocket.emit("next-round");
    }
    Loggers.Debug.log("Next round received");
};

NetworkManager.prototype.handlePartlyContentLoaded = function (data) {
    /** data.socketId
        data.loaded
        data.needsToLoad
    **/
    if (this.isServer()) {
        if (this.sockets[data.socketId]) {
            var playerIndex = this.sockets[data.socketId].playerIndex;
            this.masterSocket.emit("partly-content-loaded",
                {
                    playerIndex: playerIndex,
                    loaded: data.loaded,
                    needsToLoad: data.needsToLoad
                });
        }
    } else {
        /**
            data.playerIndex
            data.loaded
            data.needsToLoad
        **/
        if (this.events) {
            this.events.partlyContentLoaded.fire(this,
                                                 data.loaded,
                                                 data.needsToLoad,
                                                 data.playerIndex);
        }
    }
};

NetworkManager.prototype.handleContentLoaded = function (data) {
    if (this.isServer()) {
        /**
            data.socketId
        **/
        if (this.sockets[data.socketId]) {
            this.sockets[data.socketId].contentLoaded = true;

            var flag = true;
            for (var socketId in this.sockets) {
                if (!this.sockets[socketId].contentLoaded) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                this.events.contentLoaded.fire(this);
                this.masterSocket.emit("content-loaded");
                for (socketId in this.sockets) {
                    this.sockets[socketId].contentLoaded = false;
                }
            }
        }
    } else {
        if (this.events) {
            this.events.contentLoaded.fire(this);
        }
    }
};

NetworkManager.prototype.getLastUpdateFrom = function (objectId) {
    if (!this.updateQueue[objectId]) {
        return null;
    }

    if (!this.isServer()) {
        if (this.updateQueue[objectId].length > 5) { // Magic
            this.updateQueue[objectId] = this.updateQueue[objectId].slice(0, 1);
        }
    }

    return this.updateQueue[objectId].shift();
};

NetworkManager.prototype.isServer = function () {
    return this.masterSocket !== null;
};

NetworkManager.prototype.reset = function () {
    this.lastUpdate = 0;
    this.updateQueue = {};
    this.buffer = [];
    this.pendingDeaths = [];
};

NetworkManager.prototype.resetGame = function () {
    this.reset();
    this.events = null;
};

NetworkManager.prototype.cleanupSocketListeners = function () {
    this.socket.removeAllListeners("partly-content-loaded");
    this.socket.removeAllListeners("content-loaded");
    this.socket.removeAllListeners("update");
    this.socket.removeAllListeners("death");
    this.socket.removeAllListeners("scores");
    this.socket.removeAllListeners("next");
    this.socket.removeAllListeners("round");
};

module.exports = NetworkManager;
