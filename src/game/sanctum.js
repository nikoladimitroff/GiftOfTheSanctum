"use strict";
var PhysicsManager = require("./physics_manager");
var EffectManager =  require("./effect_manager");
var InputManager = require("./input_manager");
var Renderer = require("./renderer");
var ContentManager = require("./content_manager");
var UIManager = require("./ui_manager");
var PlayerManager = require("./player_manager");
var NetworkManager = require("./network_manager");
var PredictionManager = require("./prediction_manager");

var Vector = require("./math/vector");
var SanctumEvent = require("../utils/sanctum_event.js");


/* jshint ignore: start */
var window = window || {};

window.requestAnimationFrame = (function () {
    return window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame;
})();

/* jshint ignore: end */
var Actions = {
    walk: "walk",
    idle: "idle",
    spellcast1: "spellcast1",
    spellcast2: "spellcast2",
    spellcast3: "spellcast3",
    spellcast4: "spellcast4",
    spellcast5: "spellcast5",
    spellcast6: "spellcast6",
};

var Camera = function (viewport, platformSize) {
    this.viewport = viewport;
    this.platformSize = platformSize;
    this.position = new Vector();
};

Camera.prototype.follow = function (target) {
    var position = this.position;

    position.x = target.x - this.viewport.x / 2;
    position.y = target.y - this.viewport.y / 2;

    if (position.x < 0) {
        position.x = 0;
    }
    if (position.y < 0) {
        position.y = 0;
    }
    if (position.x + this.viewport.x > this.platformSize.x) {
        position.x = this.platformSize.x - this.viewport.x;
    }
    if (position.y + this.viewport.y > this.platformSize.y) {
        position.y = this.platformSize.y - this.viewport.y;
    }
};

var Sanctum = function (playerNames, selfIndex, networkManager, context) {
    this.characters = playerNames;
    this.previousTime = 0;
    this.deathsCount = 0;
    this.playerIndex = selfIndex;
    this.nextAction = Actions.walk;
    this.spellBindings = {};
    this.keybindings = {};

    this.model = {};
    this.events = {
        roundOver: new SanctumEvent(),
    };

    if (!networkManager.isServer()) {
        this.input = new InputManager();
        this.renderer = new Renderer(context, true);
    }

    this.ui = new UIManager(this.model, this.events);
    this.content = new ContentManager();
    console.log(this.content, ContentManager);
    this.physics = new PhysicsManager();
    this.playerManager = new PlayerManager(this.characters,
                                           this.physics);
    var player = this.characters[this.playerIndex];
    this.predictionManager = new PredictionManager(player);
    this.effects = new EffectManager();
    this.network = networkManager;
};

var OBJECTS = {
    monk: "character_monk",
    fireball: "content/art/spells/fireball.png",
    platform: "Basic platform",
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

Sanctum.prototype.init = function () {
    this.platform = this.content.get(OBJECTS.platform);

    var playerPositions = this.platform.generateVertices(this.characters.length,
                                                         50); // Magic

    var center = new Vector(this.platform.size.x / 2, this.platform.size.y / 2);

    for (var i = 0; i < this.characters.length; i++) {
        var player = this.content.get(CHARACTERS[i]).clone();
        player.position = playerPositions[i].add(center);
        player.name = this.characters[0];
        this.characters.shift();
        this.characters.push(player);
    }


    if (!this.network.isServer()) {
        var camera = new Camera(new Vector(), this.platform.size);
        this.renderer.init(camera);
        this.input.init(camera);
        this.updateModel();
        this.ui.init();
        this.keybindings = this.content.get("keybindings");
    }

    var spellLibrary = this.content.getSpellLibrary();
    this.effects.init(spellLibrary, this.characters, this.platform);
    this.run(0);
};

Sanctum.prototype.loadContent = function () {
    this.content.loadGameData("game_data.json",
                              this.init.bind(this),
                              this.network.isServer());
};

Sanctum.prototype.reset = function () {
    console.log("reset");
    var playerPositions = this.platform.generateVertices(this.characters.length,
                                                         50); // Magic

    for (var i = 0; i < this.characters.length; i++) {
        var player = this.characters[i];
        player.position = playerPositions[i];
        player.health = player.startingHealth;
        player.isDead = false;
    }
    this.effects.reset();
    this.spells = [];
};

Sanctum.prototype.handleInput = function () {
    for (var key in this.keybindings) {
        if (this.input.keyboard[this.input.keyNameToKeyCode(key)]) {
            this.nextAction = Actions[this.keybindings[key]];
        }
    }

    var player = this.characters[this.playerIndex];
    if (this.input.mouse.right &&
        !this.input.previousMouse.right) {

        this.playerManager.moveTo(player, this.input.mouse.absolute);
        player.playAnimation(Actions.walk, player.totalVelocity.normalized());
    }
    else if (this.input.mouse.left &&
             !this.input.previousMouse.left &&
             this.nextAction != Actions.walk &&
             this.nextAction != Actions.idle) {

        var spellName = this.spellBindings[this.nextAction];
        var spell = this.effects.castSpell(this.playerIndex,
                                           spellName,
                                           this.input.mouse.absolute);
        if (spell !== null) {
            var forward = spell.position.subtract(player.getCenter());
            Vector.normalize(forward);
            this.network.addSpellcast(spellName,
                                             this.input.mouse.absolute,
                                             this.playerIndex);
            player.playAnimation(this.nextAction, forward);
        }
        var isWalking = player.velocity.lengthSquared() < 1e-3;
        this.nextAction = [Actions.walk, Actions.idle][~~isWalking];
    }

    this.input.swap();
};

Sanctum.prototype.processNetworkData = function () {
    var payload = [];
    for (var i = 0; i < this.characters.length; i++) {
        payload.push({
            id: i,
            data: this.network.getLastUpdateFrom(i)
        });
    }

    if (!payload) { // TODO: This might be useless ?!
        return;
    }

    if (this.network.isServer()) {
        payload = payload.filter(function (item) {
            return item.data !== null;
        });
        this.network.masterSocket.emit("update", payload);
        return;
    }

    for (i = 0; i < payload.length; i++) {
        var playerPayload = payload[i].data;

        if (!playerPayload) {
            continue;
        }

        if (payload[i].id == this.playerIndex) {
            continue;
        }

        for (var j = 0; j < playerPayload.length; j++) {
            var event = playerPayload[j];
            var canSkip = false;
            switch (event.t) {
                case NetworkManager.EventTypes.ObjectInfo:
                    var player = this.characters[event.data.id];
                    canSkip = event.data.id == this.playerIndex;
                    if (canSkip) {
                        continue;
                    }

                    player.position.set(event.data.position);
                    player.velocity.set(event.data.velocity);
                    if (event.data.target) {
                        player.target = new Vector(event.data.target.x,
                                                   event.data.target.y);
                    }
                    break;

                case NetworkManager.EventTypes.Spellcast:
                    canSkip = event.data.caster == this.playerIndex;
                    if (canSkip) {
                        continue;
                    }

                    var target = new Vector(event.data.target.x,
                                            event.data.target.y);

                    this.effects.castSpell(event.data.caster,
                                           event.data.spellName,
                                           target);
                    break;
            }
        }
    }
};

Sanctum.prototype.processPendingDeaths = function () {
    var deaths = this.network.getPendingDeaths();
    if (!deaths || deaths.length < 1) {
        return;
    }

    for (var i = 0; i < deaths.length; i++) {
        var player = this.characters[deaths[i]];
        if (!player.isDead) {
            this.deathsCount++;
            player.isDead = true;
        }
    }
    this.network.pendingDeaths = [];
};

Sanctum.prototype.bindSpells = function (cast1, cast2, cast3,
                                         cast4, cast5, cast6) {

    this.spellBindings.spellcast1 = cast1;
    this.spellBindings.spellcast2 = cast2;
    this.spellBindings.spellcast3 = cast3;
    this.spellBindings.spellcast4 = cast4;
    this.spellBindings.spellcast5 = cast5;
    this.spellBindings.spellcast6 = cast6;
};

Sanctum.prototype.updateModel = function () {
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

Sanctum.mainSanctumLoop = function () {};
Sanctum.prototype.loop = function (timestamp) {
    var delta = (timestamp - this.previousTime) || 1000 / 60;
    if (!this.network.isServer()) {

        var currentPlayer = this.characters[this.playerIndex];
        if (!currentPlayer.isDead) {
            this.handleInput();
        }

        this.platform.update(delta);
        this.playerManager.update();
        this.physics.update(this.effects.characters);
        this.physics.update(this.effects.activeSpells);
        this.effects.applyEffects(this.physics, delta);
        this.effects.applyPlatformEffect(this.physics, this.platform);
        this.effects.cleanupEffects();

        this.updateModel();

        this.processPendingDeaths();

        if (currentPlayer.health <= 0 && !currentPlayer.isDead) {
            this.network.sendDie(this.playerIndex, this.objects);
            this.characters[this.playerIndex].score = this.deathsCount++;
            currentPlayer.isDead = true;
        }

        if (this.deathsCount >= this.characters.length - 1) {
            if (!this.characters[this.playerIndex].isDead) {
                this.characters[this.playerIndex].score += this.deathsCount;
            }

            this.reset();
            this.events.roundOver.fire(this.characters);
            return;
        }
        var following = !currentPlayer.isDead ?
                        this.playerIndex : this.getMaxScorePlayerIndex();
        this.renderer.camera.follow(this.characters[following].position);
        this.renderer.render(delta,
                             [this.characters, this.effects.activeSpells],
                             this.platform,
                             this.characters[this.playerIndex].isDead);
    }

    this.network.lastUpdate += delta;
    if (this.network.lastUpdate >= this.network.updateTime) {
        if (!this.network.isServer()) {
            var player = this.characters[this.playerIndex];
            // this.predictionManager.addInput(player.position);
            this.network.addObject(player, this.playerIndex);
            this.network.flush(this.playerIndex);
        }
        this.network.lastUpdate = 0;
    }

    this.processNetworkData();

    this.previousTime = timestamp;
    if (this.network.isServer()) {
        setTimeout(Sanctum.mainSanctumLoop, 1000 / 60);
    }
    else {
        requestAnimationFrame(this.mainSanctumLoop);
    }
};

Sanctum.prototype.getMaxScorePlayerIndex = function () {
    var maxScoreIndex = 0;
    var max = this.characters[0].score;
    for (var i = 1; i < this.characters.length; i++) {
        if (max < this.characters[i].score && !this.characters[i].isDead) {
            max = this.characters[i].score;
            maxScoreIndex = i;
        }
    }

    return maxScoreIndex;
};

Sanctum.prototype.run = function () {
    this.mainSanctumLoop = this.loop.bind(this);
    if (this.network.isServer()) {
        Sanctum.mainSanctumLoop = this.loop.bind(this, 1000 / 60);
    }

    this.mainSanctumLoop(0);
};

Sanctum.startNewGame = function (players, selfIndex, networkManager, context) {
    var game = new Sanctum(players, selfIndex, networkManager, context);
    game.loadContent();
    game.bindSpells("Unicorns!", "Frostfire", "Heal",
                    "Flamestrike", "Electric bolt", "Death bolt");

    return game;
};

module.exports = Sanctum;
