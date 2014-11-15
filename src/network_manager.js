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
    this.updateQueue = {};
    this.scores = {};
    this.buffer = [];
    this.pendingDeaths = [];
    this.deathIndex = 0;
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
        score: object.score,
        id: index
    };

    this.buffer.push({t/*EventType*/: sanctum.EventTypes.ObjectInfo, 
                        data: objectInfo});
}

sanctum.NetworkManager.prototype.flush = function(objectId) {
    if(this.buffer.length > 0) {
        if(!this.isServer()) {
            this.socket.emit("update", { data: this.buffer, id: objectId });
        } else {
            //TODO: Currently not going here!
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
    if(this.isServer()) {
        if(!this.updateQueue[payload.id]) {
            this.updateQueue[payload.id] = [];
        }
        this.updateQueue[payload.id].push(payload.data);
    } else {
        for(var i = 0; i < payload.length; i++) {
            if(!this.updateQueue[payload[i].id]) {
                this.updateQueue[payload[i].id] = [];
            }
            this.updateQueue[payload[i].id].push(payload[i].data);
        }
    }
}

sanctum.NetworkManager.prototype.handleDeath = function(data) {
    if(this.isServer()) {
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
    objects[playerIndex].score = this.deathIndex++;
    // this.socket.emit("scores", {index: playerIndex, score: objects[playerIndex].score});
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

sanctum.NetworkManager.prototype.getLastUpdateFrom = function(objectId) {
    if(!this.updateQueue[objectId]) {
        return null;
    }
    return this.updateQueue[objectId].shift();
}

sanctum.NetworkManager.prototype.isServer = function() {
    return this.masterSocket != null;
}

if(typeof module != "undefined" && module.exports) {
    module.exports = sanctum.NetworkManager;
}
