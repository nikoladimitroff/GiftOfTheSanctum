"use strict";
var PhysicsManager = require("./physics_manager");
var EffectManager =  require("./effect_manager");
var InputManager = require("./input_manager");
var Renderer = require("./renderer");
var AudioManager = require("./audio_manager");
var ContentManager = require("./content_manager");
var UIManager = require("./ui_manager");
var PlayerManager = require("./player_manager");
var NetworkManager = require("./network_manager");
var PredictionManager = require("./prediction_manager");

var GameState = require("./enums").GameState,
    Action = require("./enums").Action;

var Vector = require("./math/vector");
var SanctumEvent = require("../utils/sanctum_event.js");
var stub = require("../utils/stub.js");


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
                        viewmodel, context, options) {
    options = options || {};
    if (options.inEditor) {
        networkManager = new (stub(NetworkManager))();
        UIManager = stub(UIManager);
    }

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
        contentLoaded: new SanctumEvent(),
        initializationComplete: new SanctumEvent(),
        roundOver: new SanctumEvent(),
        nextRound: new SanctumEvent(),
        scoresInfo: new SanctumEvent(),
    };
    networkManager.events = this.events;

    if (!networkManager.isServer()) {
        this.input = new InputManager();
        this.audio = new AudioManager();
        this.renderer = new Renderer(context,
                                     options.debug,
                                     options.autoresize);
        this.ui = new UIManager(viewmodel, this.events);

        this.events.scoresInfo.addEventListener(function (_, score, index) {
            this.characters[index].score = score;
        }.bind(this));

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
                                                   150, // Magic
                                                   center);

    for (var i = 0; i < this.characters.length; i++) {
        var player = this.content.get(CHARACTERS[i]);
        player.position = positions[i];
        player.name = this.characters.shift();
        this.characters.push(player);
    }

    var spellLibrary = this.content.getSpellLibrary();
    this.effects.init(spellLibrary, this.characters, this.platform);

    if (!this.network.isServer()) {
        var camera = new Camera(new Vector(), this.platform.size);
        this.renderer.init(camera);
        this.audio.init(this.content.get(this.content.audioLibraryKey));
        this.effects.audio = this.audio;
        this.audio.play(this.platform.soundtrack);
        this.input.init(this.renderer.context.canvas, camera);
        this.keybindings = this.content.get("keybindings");
        this.model = {
            characters: this.characters,
            state: GameState.midround,
            keybindings: this.keybindings,
            boundSpells: this.spellBindings,
            // Getters
            getSpellIcon: this.effects.getSpellIcon.bind(this.effects),
            getSpellDamage: this.effects.getSpellDamage.bind(this.effects),
            getSpellCooldown: this.effects.getSpellCooldown
                              .bind(this.effects),
            getSpellDescription: this.effects.getSpellDescription
                                 .bind(this.effects),
            getSpellRemainingCooldown: this.effects.getSpellRemainingCooldown
                                       .bind(this.effects, this.playerIndex),
            getSpellCoolingPercentage: this.effects.getSpellCoolingPercentage
                                       .bind(this.effects, this.playerIndex),
        };
        this.ui.init(this.model);
    }
    this.events.initializationComplete.fire(this);
    this.run(0);
};

Sanctum.prototype.loadContent = function () {
    var callback = function () {
        this.events.contentLoaded.fire(this);
        this.init();
    }.bind(this);
    this.content.loadGameData("game_data.json",
                              callback,
                              this.network.isServer());
};

Sanctum.prototype.reset = function () {
    console.log("reset");
    var center = this.platform.size.divide(2);
    var positions = this.platform.generateVertices(this.characters.length,
                                                   150, // Magic
                                                   center);

    for (var i = 0; i < this.characters.length; i++) {
        var player = this.characters[i];
        player.position = positions[i];
        player.velocity.set(Vector.zero);
        player.acceleration.set(Vector.zero);
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
        this.audio.play(player.voice.move);
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
            this.audio.play(player.voice.cast);
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
            currentPlayer.score += this.deathsCount++;
            this.network.sendDie(this.playerIndex);
            this.network.sendScores(this.playerIndex, currentPlayer.score);
            currentPlayer.isDead = true;
        }

        this.ui.update();
        if (this.deathsCount >= this.characters.length - 1) {
            if (!currentPlayer.isDead) {
                currentPlayer.score += this.deathsCount;
                this.network.sendScores(this.playerIndex, currentPlayer.score);
            }
            return GameState.midround;
        }
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
        this.timeoutId = setTimeout(this.mainSanctumLoop, 1000 / 60);
    }
    else {
        this.timeoutId = requestAnimationFrame(this.mainSanctumLoop);
    }
};

Sanctum.prototype.forceStop = function () {
    if (this.network.isServer()) {
        clearTimeout(this.timeoutId);
    }
    else {
        cancelAnimationFrame(this.timeoutId);
    }
    this.model.state = GameState.midround;
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
        this.mainSanctumLoop = this.loop.bind(this, 1000 / 60);
    }

    this.model.state = GameState.playing;
    this.mainSanctumLoop(0);
};

Sanctum.startNewGame = function (players, selfIndex, networkManager,
                                 viewmodel, context, options) {
    var game = new Sanctum(players,
                           selfIndex,
                           networkManager,
                           viewmodel,
                           context,
                           options);
    game.loadContent();
    game.bindSpells("Unicorns!", "Frostfire", "Heal",
                    "Flamestrike", "Electric bolt", "Deathbolt");
    Sanctum.activeGame = game;
    return game;
};

module.exports = Sanctum;
global.Sanctum = Sanctum;
