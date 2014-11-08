var sanctum = sanctum || {};

sanctum.EventTypes = {
    Spellcast: 0,
    CharacterInfo: 1,
    ObjectInfo: 2
};

sanctum.Network = function () {
    this.port = 8080;
    this.ip = "127.0.0.1";

    this.masterSocket = null;
    this.socket = null;
    this.sockets = [];
    this.updateQueue = [];
    this.buffer = [];
};

sanctum.Network.prototype.setup = function(masterSocket, socket) {
    if(!masterSocket) {
        this.socket = socket;
    } else {
        this.sockets.push(socket);
        this.masterSocket = masterSocket;
    }

    socket.on("update", this.handleUpdate.bind(this));
}

sanctum.Network.prototype.addSpellcast = function(spellName, target, caster) {
    this.buffer.push({t/*EventType*/: sanctum.EventTypes.Spellcast, 
                        data: {spellName: spellName, target: target, caster: caster}});
}

sanctum.Network.prototype.addCharacterInfo = function(character) {
    var characterInfo = {
        position: character.position,
        velocity: character.velocity,
        id: character.id
    };

    this.buffer.push({t/*EventType*/: sanctum.EventTypes.CharacterInfo, 
                        data: character });
}

sanctum.Network.prototype.addObject = function(object) {
    var objectInfo = {
        position: object.position,
        velocity: object.velocity,
        id: object.id
    };

    this.buffer.push({t/*EventType*/: sanctum.EventTypes.ObjectInfo, 
                        data: objectInfo});
}

sanctum.Network.prototype.flush = function() {
    if(this.buffer.length > 0) {
        if(!this.masterSocket) {
            this.socket.emit("update", this.buffer);        
        } else {
            this.masterSocket.emit("update", this.buffer);
        }
    }

    this.buffer = [];
}

sanctum.Network.prototype.handleUpdate = function(payload /*Array*/) {
    this.updateQueue.push(payload.data);
}

sanctum.Network.prototype.getLastUpdate = function() {
    return this.updateQueue.shift();
}

var networkManager;
if(typeof module != "undefined" && module.exports) {
    module.exports = new sanctum.Network();
} else {
    networkManager = new sanctum.Network();
}
