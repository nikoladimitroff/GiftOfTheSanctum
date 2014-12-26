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

var GameState = require("./enums").GameState,
    Action = require("./enums").Action;

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

var SPELLCAST_COUNT = 6;

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

var Sanctum = function (playerNames, selfIndex, networkManager,
                        viewmodel, context) {
    this.characters = playerNames;
    this.previousTime = 0;
    this.deathsCount = 0;
    this.playerIndex = selfIndex;
    this.nextAction = Action.walk;
    this.spellBindings = [];
    this.keybindings = {};
    this.model = {};

    this.content = new ContentManager();
    this.physics = new PhysicsManager();
    this.playerManager = new PlayerManager(this.characters,
                                           this.physics);
    var player = this.characters[this.playerIndex];
    this.predictionManager = new PredictionManager(player);
    this.effects = new EffectManager();
    this.network = networkManager;

    this.events = {
        roundOver: new SanctumEvent(),
        nextRound: new SanctumEvent(),
    };
    networkManager.events = this.events;

    if (!networkManager.isServer()) {
        this.input = new InputManager();
        this.renderer = new Renderer(context, true);
        this.ui = new UIManager(viewmodel, this.events);
        this.events.nextRound.addEventListener(function (sender) {
            if (sender === this.ui) {
                // The next round button has been clicked
                this.network.sendNextRound();
            }
            else if (sender === this.network) {
                // The network manager received a "next-round" command
                this.reset();
                this.run();
            }
        }.bind(this));
    }
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


    var center = this.platform.size.divide(2);
    var positions = this.platform.generateVertices(this.characters.length,
                                                   50, // Magic
                                                   center);

    for (var i = 0; i < this.characters.length; i++) {
        var player = this.content.get(CHARACTERS[i]).clone();
        player.position = positions[i];
        player.name = this.characters.shift();
        this.characters.push(player);
    }

    var spellLibrary = this.content.getSpellLibrary();
    this.effects.init(spellLibrary, this.characters, this.platform);

    if (!this.network.isServer()) {
        var camera = new Camera(new Vector(), this.platform.size);
        this.renderer.init(camera);
        this.input.init(camera);
        this.keybindings = this.content.get("keybindings");
        this.model = {
            characters: this.characters,
            state: GameState.midround,
            keybindings: this.keybindings,
            boundSpells: this.spellBindings,
            // Getters
            getSpellIcon: this.effects.getSpellIcon.bind(this.effects),
            getSpellRemainingCooldown: this.effects.getSpellRemainingCooldown
                                       .bind(this.effects, this.playerIndex),
            getSpellCoolingPercentage: this.effects.getSpellCoolingPercentage
                                       .bind(this.effects, this.playerIndex),
        };
        this.ui.init(this.model);
    }

    this.run(0);
};

Sanctum.prototype.loadContent = function () {
    this.content.loadGameData("game_data.json",
                              this.init.bind(this),
                              this.network.isServer());
};

Sanctum.prototype.reset = function () {
    console.log("reset");
    var center = this.platform.size.divide(2);
    var positions = this.platform.generateVertices(this.characters.length,
                                                   50, // Magic
                                                   center);

    for (var i = 0; i < this.characters.length; i++) {
        var player = this.characters[i];
        player.position = positions[i];
        player.target = null;
        player.health = player.startingHealth;
        player.isDead = false;
    }
    this.model.state = GameState.midround;
    this.previousTime = 0;
    this.deathsCount = 0;
    this.effects.reset();
    this.network.reset();
    this.spells = [];
    this.ui.toggleScoreboard();
};

Sanctum.prototype.handleInput = function () {
    for (var i = 0; i < SPELLCAST_COUNT; i++) {
        var action = "spellcast" + i;
        var key = this.keybindings[action];
        if (this.input.keyboard[this.input.keynameToCode(key)]) {
            this.nextAction = Action[action];
        }
    }

    // Respond to game
    var player = this.characters[this.playerIndex];
    if (this.input.mouse.right &&
        !this.input.previousMouse.right) {

        this.playerManager.moveTo(player, this.input.mouse.absolute);
        player.playAnimation(Action.walk, player.totalVelocity.normalized());
    }
    else if (this.input.mouse.left &&
             !this.input.previousMouse.left &&
             this.nextAction != Action.walk &&
             this.nextAction != Action.idle) {

        var spellIndex = ~~this.nextAction[this.nextAction.length - 1];
        var spellName = this.spellBindings[spellIndex];
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
        this.nextAction = [Action.walk, Action.idle][~~isWalking];
    }

    // Respond to UI
    var scoreboardKey = this.keybindings.toggleScoreboard,
        scoreboardCode = this.input.keynameToCode(scoreboardKey);
    if (this.input.keyboard[scoreboardCode] &&
        !this.input.previousKeyboard[scoreboardCode]) {

        this.ui.toggleScoreboard();
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

Sanctum.prototype.bindSpells = function (cast0, cast1, cast2,
                                         cast3, cast4, cast5) {

    this.spellBindings[0] = cast0;
    this.spellBindings[1] = cast1;
    this.spellBindings[2] = cast2;
    this.spellBindings[3] = cast3;
    this.spellBindings[4] = cast4;
    this.spellBindings[5] = cast5;
};

Sanctum.mainSanctumLoop = function () {};

Sanctum.prototype.update = function (delta) {
    this.processNetworkData();

    if (!this.network.isServer()) {
        var currentPlayer = this.characters[this.playerIndex];
        if (!currentPlayer.isDead) {
            this.handleInput();
        }

        this.platform.update(delta);
        this.playerManager.update();
        this.physics.update(this.effects.characters);
        this.physics.update(this.effects.activeSpells);
        this.effects.update(delta, this.physics, this.platform);

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
            return GameState.midround;
        }
        this.ui.update();
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

    return GameState.playing;
};

Sanctum.prototype.render = function (delta) {
    var currentPlayer = this.characters[this.playerIndex];
    var following = !currentPlayer.isDead ?
                    this.playerIndex : this.getMaxScorePlayerIndex();
    this.renderer.camera.follow(this.characters[following].position);
    this.renderer.render(delta,
                         [this.characters, this.effects.activeSpells],
                         this.platform,
                         this.characters[this.playerIndex].isDead);
};

Sanctum.prototype.loop = function (timestamp) {
    var delta = (timestamp - this.previousTime) || 1000 / 60;

    this.model.state = this.update(delta);
    if (this.model.state !== GameState.playing) {
        this.events.roundOver.fire(this);
        return;
    }

    if (!this.network.isServer()) {
        this.render(delta);
    }

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

    this.model.state = GameState.playing;
    this.mainSanctumLoop(0);
};

Sanctum.startNewGame = function (players, selfIndex, networkManager,
                                 viewmodel, context) {
    var game = new Sanctum(players,
                           selfIndex,
                           networkManager,
                           viewmodel,
                           context);
    game.loadContent();
    game.bindSpells("Unicorns!", "Frostfire", "Heal",
                    "Flamestrike", "Electric bolt", "Death bolt");
    return game;
};

module.exports = Sanctum;
