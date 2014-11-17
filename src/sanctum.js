var sanctum = require("./all_sanctum") || sanctum;

sanctum = sanctum || {};

var allPhysics = require("./physics");
var physics = physics || {};
var Vector = Vector || {};

if (allPhysics) {
    physics = allPhysics.physics || physics;
    Vector = allPhysics.Vector || Vector;
}

var allGameObjects = require("./game_objects");

if (allGameObjects) {
    sanctum.Obstacle = allGameObjects.Obstacle;
}

var Event = Event || require("./utils/event.js")


var window = window || {};

requestAnimationFrame = (function () {
    return window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame;
})();

function getRequestAnimationFrame() {
    var startTime = Date.now();
    return function requestServerFrame(callback) {
        setTimeout(function () {
            callback(Date.now() - startTime);
        }, 1000 / 60);
    };
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

sanctum.Camera = function (viewport, platformSize) {
    this.viewport = viewport;
    this.platformSize = platformSize;
    this.position = new Vector();
}

sanctum.Camera.prototype.follow = function (target) {
    var position = this.position;

    position.x = target.x - this.viewport.x / 2;
    position.y = target.y - this.viewport.y / 2;

    if (target.x - this.viewport.x / 2 < 0) {
        position.x = 0;
    }
    if (target.y - this.viewport.y / 2 < 0) {
        position.y = 0;
    }
    if (target.x + this.viewport.x / 2 > this.platformSize.x) {
        position.x = this.platformSize.x - this.viewport.x;
    }
    if (target.y + this.viewport.y / 2 > this.platformSize.y) {
        position.y = this.platformSize.y - this.viewport.y;
    }

}

sanctum.Game = function (context, playerNames, selfIndex, networkManager) {
    this.characters = playerNames;
    this.previousTime = 0;
    this.deathsCount = 0;
    this.playerIndex = selfIndex;
    this.nextAction = Actions.walk;
    this.spellBindings = {};
    this.keybindings = {};

    this.model = {};
    this.events = {
        roundOver: new Event(),
    };

    if(!networkManager.isServer()) {
        this.input = new sanctum.InputManager();
        this.renderer = new sanctum.Renderer(context);
    }

    this.ui = new sanctum.UIManager(this.model, this.events);
    this.contentManager = new sanctum.ContentManager();
    this.physicsManager = new sanctum.PhysicsManager();
    this.effectManager = new sanctum.EffectManager();
    this.networkManager = networkManager;
};

var OBJECTS = {
    "monk": "character_monk",
    "fireball": "content/art/spells/fireball.png",
    "platform": "Basic platform",
};

var CHARACTERS = [
    "character_archer",
    "character_knight",
    "character_mage",
    "character_monk",
    "character_necro",
    "character_orc",
    "character_queen",
    "character_rogue",
];

sanctum.Game.prototype.init = function () {
    this.platform = this.contentManager.get(OBJECTS["platform"]);

    var playerPositions = this.platform.generateVertices(this.characters.length, 50); // magic

    var center = new Vector(this.platform.size.x / 2, this.platform.size.y / 2);

    for (var i = 0; i < this.characters.length; i++) {
        var player = this.contentManager.get(CHARACTERS[i]).clone();        
        player.position = playerPositions[i].add(center);
        player.name = this.characters[0];
        this.characters.shift();
        this.characters.push(player);
    }


    if (!this.networkManager.isServer()) {
        var camera = new sanctum.Camera(new Vector(), this.platform.size);
        this.renderer.init(camera);
        this.input.init(camera);
        this.updateModel();
        this.ui.init();
        this.keybindings = this.contentManager.get("keybindings");
    }

    var spellLibrary = this.contentManager.getSpellLibrary();
    this.effectManager.init(spellLibrary, this.characters, this.platform);
    this.run(0);
}

sanctum.Game.prototype.loadContent = function () {
    this.contentManager.loadGameData("game_data.json", this.init.bind(this), this.networkManager.isServer());
}

sanctum.Game.prototype.reset = function() {
    console.log("reset");
    var playerPositions = this.platform.generateVertices(this.characters.length, 50); // magic

    for(var i = 0; i < this.characters.length; i++) {
        var player = this.characters[i];
        player.position = playerPositions[i];
        player.health = player.startingHealth;
        player.isDead = false;
    }
    this.effectManager.reset();
    this.spells = [];
}

sanctum.Game.prototype.handleInput = function () {
    for (var key in this.keybindings) {
        if (this.input.keyboard[this.input.keyNameToKeyCode(key)]) {
            this.nextAction = Actions[this.keybindings[key]];
        }
    }

    var player = this.characters[this.playerIndex];
    if (this.input.mouse.right && 
        !this.input.previousMouse.right) {
        player.velocity = this.input.mouse.absolute.subtract(player.position);
        Vector.normalize(player.velocity);
        Vector.multiply(player.velocity, player.speed, player.velocity);
        player.playAnimation(Actions.walk, player.velocity.normalized());
    }
    else if (this.input.mouse.left && 
             !this.input.previousMouse.left &&
             this.nextAction != Actions.walk) {
        var spellName = this.spellBindings[this.nextAction];
        var spell = this.effectManager.castSpell(this.playerIndex,
                                                 spellName,
                                                 this.input.mouse.absolute);
        if (spell !== null) {
            var forward = spell.position.subtract(player.position).normalized();
            player.playAnimation(this.nextAction, forward);
            this.networkManager.addSpellcast(spellName, this.input.mouse.absolute, this.playerIndex);
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
            case sanctum.EventTypes.ObjectInfo:
                var player = this.characters[event.data.id];
                var canSkip = event.data.id == this.playerIndex;
                if(canSkip) {
                    continue;
                }
                var evpos = new Vector().set(event.data.position);
                var evvel = new Vector().set(event.data.velocity);

                player.position.set(evpos);
                player.velocity.set(evvel);
                break;

            case sanctum.EventTypes.Spellcast:
                var canSkip = event.data.caster == this.playerIndex;
                if(canSkip) {
                    continue;
                }

                var spell = this.effectManager.castSpell(event.data.caster,
                                                         event.data.spellName,
                                                         new Vector().set(event.data.target));
                break;
        }
     }
}

sanctum.Game.prototype.processPendingDeaths = function() {
    var deaths = this.networkManager.getPendingDeaths();
    if(!deaths || deaths.length < 1) {
        return;
    }

    for(var i = 0; i < deaths.length; i++) {
        var player = this.characters[deaths[i]];
        if(!player.isDead) {
            this.deathsCount++;
            player.isDead = true;
        }
    }
    this.networkManager.pendingDeaths = [];
}

sanctum.Game.prototype.bindSpells = function (cast1, cast2, cast3, cast4, cast5, cast6) {
    for (var i = 0; i < arguments.length; i++) { // magic, fix the number of casts
        this.spellBindings["spellcast" + (i + 1)] = arguments[i];
    }
};

sanctum.Game.prototype.updateModel = function () {
    this.model.scores = this.characters.map(function (character, id) {
        return {
            id: id,
            name: character.name,
            score: character.score
        };
    });

    this.model.scores.sort(function (first, second) {
        if (first.score == second.score)
            return first.name < second.name;
        return first.score < second.score;
    });
};

sanctum.Game.mainGameLoop = function () {};
sanctum.Game.prototype.loop = function (timestamp) {
    var delta = (timestamp - this.previousTime) || 1000 / 60;

    if (!this.networkManager.isServer()) {
        this.platform.update(delta);
        this.physicsManager.update(this.effectManager.characters);
        this.physicsManager.update(this.effectManager.activeSpells);
        this.effectManager.applyEffects(this.physicsManager, delta);
        this.effectManager.applyPlatformEffect(this.physicsManager, this.platform);
        this.effectManager.cleanupEffects();

        this.updateModel();
        
        this.processPendingDeaths();

        var currentPlayer = this.characters[this.playerIndex];
        if (currentPlayer.health <= 0 && !currentPlayer.isDead) {
            this.networkManager.sendDie(this.playerIndex, this.objects);
            this.characters[this.playerIndex].score = this.deathsCount++;
            currentPlayer.isDead = true;
        }

        if(this.deathsCount >= this.characters.length - 1) {
            if(!this.characters[this.playerIndex].isDead) {
                this.characters[this.playerIndex].score += this.deathsCount;
            }

//            this.reset();
//            this.events.roundOver.fire(this.characters);
//            return;
        }
        
        if(!currentPlayer.isDead) {
            this.handleInput();
        }
        
        var following = !currentPlayer.isDead ? this.playerIndex : this.getMaxScorePlayerIndex();
        this.renderer.camera.follow(this.characters[following].position);
        this.renderer.render(delta, 
                             [this.characters, this.effectManager.activeSpells],
                             this.platform,
                             this.characters[this.playerIndex].isDead
                             );
    }

    this.networkManager.lastUpdate += delta;
    if(this.networkManager.lastUpdate >= this.networkManager.updateTime) {
        if(!this.networkManager.isServer()) {
            this.networkManager.addObject(this.characters[this.playerIndex], this.playerIndex);
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

sanctum.Game.prototype.getMaxScorePlayerIndex = function() {
    var maxScoreIndex = 0;
    var max = this.characters[0].score;
    for(var i = 1; i < this.characters.length; i++) {
        if(max < this.characters[i].score && !this.characters[i].isDead) {
            max = this.characters[i].score;
            maxScoreIndex = i;
        }
    }

    return maxScoreIndex;
}

sanctum.Game.prototype.run = function () {
    this.mainGameLoop = this.loop.bind(this);
    if (this.networkManager.isServer()) {
        sanctum.Game.mainGameLoop = this.loop.bind(this, 1000 / 60);
    }

    this.mainGameLoop(0);
}

var canvas, game;

function startAll(players, selfIndex, networkManager) {
    canvas = document.getElementById("game-canvas");
    game = new sanctum.Game(canvas.getContext("2d"), players, selfIndex, networkManager);
    game.loadContent();
    game.bindSpells("Unicorns!", "Frostfire", "Heal", "Flamestrike", "Electric bolt", "Death bolt");

}

// startAll();


if(typeof module != "undefined" && module.exports) {
    module.exports = sanctum.Game;
}
