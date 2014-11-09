var sanctum = require("./all_sanctum") || sanctum;

sanctum = sanctum || {};

var allPhysics = require("./physics");
var physics = physics || {};
var Vector = Vector || {};

if(allPhysics) {
    physics = allPhysics.physics || physics;
    Vector = allPhysics.Vector || Vector;
}


var window = window || {};

requestAnimationFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame
})();

function getRequestAnimationFrame() {
    var startTime = Date.now();
    return function requestServerFrame(callback) {
        setTimeout(function () {
            callback(Date.now() - startTime)
        }, 1000 / 60);
    }
}

Actions = {
    walk: "walk",
    spellcast1: "spellcast1",
    spellcast2: "spellcast2",
    spellcast3: "spellcast3",
    spellcast4: "spellcast4",
    spellcast5: "spellcast5",
    spellcast6: "spellcast6",
};

sanctum.Camera = function(viewport, platformSize) {
    this.viewport = viewport;
    this.platformSize = platformSize;
    this.position = new Vector();
}

sanctum.Camera.prototype.follow = function(target) {
    var position = this.position;

    position.x = target.x - this.viewport.x / 2;
    position.y = target.y - this.viewport.y / 2;

    if(target.x - this.viewport.x / 2 < 0) {
        position.x = 0;
    }
    if(target.y - this.viewport.y / 2 < 0) {
        position.y = 0;
    }
    if(target.x + this.viewport.x / 2 > this.platformSize.x) {
        position.x = this.platformSize.x - this.viewport.x;
    }
    if(target.y + this.viewport.y / 2 > this.platformSize.y) {
        position.y = this.platformSize.y - this.viewport.y;
    }

}

sanctum.Game = function (context, playerCount, selfIndex, networkManager) {
    this.objects = []; // The first playerCount indices hold the characters
    this.playerCount = playerCount;
    this.previousTime = 0;
    this.playerObjectIndex = selfIndex;
    this.nextAction = Actions.walk;
    this.spellBindings = {};
    this.keybindings = {};

    if(!networkManager.isServer()) {
        this.input = new sanctum.InputManager();
        this.renderer = new sanctum.Renderer(context);
    }

    this.contentManager = new sanctum.ContentManager();
    this.physicsManager = new sanctum.PhysicsManager();
    this.effectManager = new sanctum.EffectManager();
    this.networkManager = networkManager;
};

var OBJECTS = {
    "monk": "character_monk",
    "fireball": "content/art/spells/fireball.png",
    "platform": "Basic platform",
}

var CHARACTERS = [
    "character_monk",
    "character_orc",
];

sanctum.Game.prototype.init = function () {
    this.platform = this.contentManager.get(OBJECTS["platform"]);

    if(!this.networkManager.isServer()) {
        var camera = new sanctum.Camera(new Vector(), this.platform.size);
        this.renderer.init(camera);
        this.input.init(camera);
        this.keybindings = this.contentManager.get("keybindings");
    }

    var playerPositions = this.platform.generateVertices(this.playerCount, 50);

    for(var i = 0; i < this.playerCount; i++) {
        var player = this.contentManager.get(CHARACTERS[i]).clone();
        player.position = playerPositions[i];
        this.objects.push(player);
    }

    var spellLibrary = this.contentManager.getSpellLibrary();
    
    this.effectManager.init(spellLibrary, this.objects, this.platform);
    this.run(0);
}

sanctum.Game.prototype.loadContent = function () {
    this.contentManager.loadGameData("game_data.json", this.init.bind(this), this.networkManager.isServer());
}

sanctum.Game.prototype.handleInput = function () {
    for (var key in this.keybindings) {
        if (this.input.keyboard[this.input.keyNameToKeyCode(key)]) {
            this.nextAction = Actions[this.keybindings[key]];
        }
    }

    if (this.input.mouse.left && !this.input.previousMouse.left) {
        var player = this.objects[this.playerObjectIndex];
        switch (this.nextAction) {
            case Actions.walk:
                player.velocity = this.input.mouse.absolute.subtract(player.position);
                Vector.normalize(player.velocity);
                Vector.multiply(player.velocity, 100, player.velocity); // magic;
                player.playAnimation(Actions.walk, player.velocity.normalized());
                break;
            default:
                var spellName = this.spellBindings[this.nextAction];
                var spell = this.effectManager.castSpell(this.objects[this.playerObjectIndex],
                                                         spellName,
                                                         this.input.mouse.absolute);
                //this.objects.push(spell);
                this.networkManager.addSpellcast(spellName, this.input.mouse.absolute, this.playerObjectIndex);
                var forward = spell.position.subtract(player.position).normalized();
                player.playAnimation(this.nextAction, forward);
        }
        this.nextAction = Actions.walk;
    }
    this.input.swap();
}

sanctum.Game.prototype.processNetworkData = function() {
    var payload = this.networkManager.getLastUpdate();
    if (!payload) {
        return;
    }

    if(this.networkManager.isServer()) {
        this.networkManager.masterSocket.emit("update", payload);
        return;
    }

    for (var i = 0; i < payload.length; i++) {
        var event = payload[i];
        switch (event.t) {
            case sanctum.EventTypes.CharacterInfo:
                var player = this.objects[event.data.id];
               // var newPos = player.velocity.multiply(this.networkManager.updateTime)
               //                     .add(new Vector(event.data.position.x, event.data.position.y));
               // player.position.set(newPos);
               var canSkip = event.data.id == this.playerObjectIndex;
               if(canSkip) {
                    continue;
               }
               var evpos = new Vector().set(event.data.position);
               var evvel = new Vector().set(event.data.velocity);
               // var limit = 3;
               // var posDist = player.position.subtract(evpos).length();
               //  if (!canSkip || posDist >= limit) {
               //      player.position = Vector.lerp(player.position, evpos, 0.5)
               //  }
               //  var velDist = player.velocity.subtract(evvel).length();
               //  if (!canSkip || velDist >= limit) {
               //      player.velocity = Vector.lerp(player.velocity, evvel, 0.5)
               //  }
                player.position.set(evpos);
                player.velocity.set(evvel);
                break;

            case sanctum.EventTypes.Spellcast:
                var spell = this.effectManager.castSpell(this.objects[event.data.caster],
                                                         event.data.spellName,
                                                         new Vector().set(event.data.target));
                break;
        }
     }
}   

sanctum.Game.prototype.bindSpells = function (cast1, cast2, cast3, cast4, cast5, cast6) {
    for (var i = 0; i < arguments.length; i++) { // magic, fix the number of casts
        this.spellBindings["spellcast" + (i + 1)] = arguments[i];
    }
};

sanctum.Game.mainGameLoop = function () {};
sanctum.Game.prototype.loop = function (timestamp) {
    var delta = (timestamp - this.previousTime) || 1000 / 60;

    if(!this.networkManager.isServer()) {
        this.platform.update(delta);
        this.physicsManager.update(this.objects);
        this.effectManager.applyEffects(this.physicsManager);
        this.effectManager.applyPlatformEffect(this.physicsManager,
                                               this.platform,
                                               this.playerCount
                                               );
        this.effectManager.cleanupEffects(this.playerCount);
    }

    if(!this.networkManager.isServer()) {
        this.handleInput();       
        this.renderer.camera.follow(this.objects[this.playerObjectIndex].position);
        this.renderer.render(this.platform, this.objects, delta);        
    }

    this.networkManager.lastUpdate += delta;
    if(this.networkManager.lastUpdate >= this.networkManager.updateTime) {
        if(!this.networkManager.isServer()) {
            // this.networkManager.addObjectData(this.objects, this.playerCount);
            this.networkManager.addCharacterInfo(this.objects[this.playerObjectIndex], this.playerObjectIndex);
            this.networkManager.flush();
        }
        this.networkManager.lastUpdate = 0;        
    }

    this.processNetworkData();
    
    this.previousTime = timestamp;
    if (this.networkManager.isServer()) {
        setTimeout(sanctum.Game.mainGameLoop, 1000 / 60)
    }
    else {
        requestAnimationFrame(this.mainGameLoop);
    }
}

sanctum.Game.prototype.run = function () {
    this.mainGameLoop = this.loop.bind(this);
    if (this.networkManager.isServer()) {
        sanctum.Game.mainGameLoop = this.loop.bind(this, 1000 / 60);
    }
    //requestAnimationFrame = getRequestAnimationFrame();
    this.mainGameLoop(0);
}

var canvas, game;

function startAll(playerCount, selfIndex, networkManager) {
    canvas = document.getElementById("game-canvas");
    game = new sanctum.Game(canvas.getContext("2d"), playerCount, selfIndex, networkManager);
    game.loadContent();
    game.bindSpells("Fireball", "Freeze", "Frostbolt", 
                    "Heal", "Speed up!", "Healing well");

}

// startAll();

function testCast() {
    m = game.objects[0];
    e = game.effectManager;
    p = game.physicsManager;
    game.objects.push(e.castSpell(m, "fireball", new Vector(0, 0)));
}

if(typeof module != "undefined" && module.exports) {
    module.exports = sanctum.Game;
}