var sanctum = sanctum || {};

sanctum.EventTypes = {
    Spellcast: 0,
    CharacterInfo: 1,
    ObjectInfo: 2
};

sanctum.Network = function () {
    this.port = 8080;
    this.ip = "127.0.0.1";

    this.socket = null;
    this.buffer = [];
};

sanctum.Network.prototype.setup = function(socket) {
    this.socket = socket;

    this.socket.on("update", this.handleUpdate);
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
    this.socket.emit("update", this.buffer);
}

sanctum.Network.prototype.listen = function() {
    
}

sanctum.Network.prototype.handleUpdate = function(payload /*Array*/) {
    for(event in payload) {
        switch(event.t) {
            case sanctum.EventTypes.CharacterInfo:

                break;

            case sanctum.EventTypes.Spellcast:
                break;

            case sanctum.EventTypes.ObjectInfo:
                break;
        }
    }
}

module.exports = new sanctum.Network();