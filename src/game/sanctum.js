"use strict";
var Loggers = require("../utils/logger");
var SanctumEvent = require("../utils/sanctum_event.js");
var ArrayUtils = require("../utils/array_utils");
var stub = require("../utils/stub.js");

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
    this.currentRound = 0;
    this.playerIndex = selfIndex;
    this.nextAction = Action.walk;
    this.spellBindings = [];
    this.keybindings = {};
    this.model = {};

    this.content = new ContentManager();
    this.physics = new PhysicsManager();
    this.playerManager = new PlayerManager(this.characters,
                                           this.physics);
    this.predictionManager = new PredictionManager(this.characters,
                                                   networkManager);
    this.effects = new EffectManager();
    this.network = networkManager;

    // Properties
    Object.defineProperty(this, "deadCount", {
        get: function () {
            return ArrayUtils.count(this.characters, function (character) {
                return character.isDead;
            });
        }
    });

    // Events
    this.events = {
        contentLoaded: new SanctumEvent(),
        initializationComplete: new SanctumEvent(),
        roundOver: new SanctumEvent(),
        nextRound: new SanctumEvent(),
        gameOver: new SanctumEvent(),
        scoresInfo: new SanctumEvent(),
        endGame: new SanctumEvent()
    };
    networkManager.events = this.events;

    // Server / client specializations
    if (!networkManager.isServer()) {
        this.input = new InputManager();
        this.audio = new AudioManager();
        this.renderer = new Renderer(context,
                                     options.debug,
                                     options.autoresize);
        this.ui = new UIManager(viewmodel, this.events);
    }
    else {
        var StatManager = require("./stat_manager");
        this.stat = new StatManager();
        networkManager.recorder = this.stat;
    }

    // Event handlers
    this.events.scoresInfo.addEventListener(function (_, score, index) {
        this.characters[index].score += score;
        if (!this.network.isServer()) {
            this.ui.update();
        }
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
        var playerData = this.characters.shift();
        var player = this.content.get(CHARACTERS[i]);

        if (this.network.isServer()) {
            player.name = playerData.name;
            player.id = playerData.id;
            player.azureId = playerData.azureId;
        } else {
            player.name = playerData;
        }

        player.position = positions[i];
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
    else {
        this.stat.init(this.characters,
                       this.content.getAchievementLibrary());
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
    Loggers.Debug.log("Round reset.");
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
    this.effects.reset();
    this.network.reset();
    this.spells = [];
    if (!this.network.isServer()) {
        this.ui.viewmodel.showScoreboard(false);
    }
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

    var playerPayload,
        event, j;

    if (this.network.isServer()) {
        payload = payload.filter(function (item) {
            return item.data !== null;
        });

        for (i = 0; i < payload.length; i++) {
            playerPayload = payload[i].data;

            if (!playerPayload) {
                continue;
            }

            for (j = 0; j < playerPayload.length; j++) {
                event = playerPayload[j];
                if (event.t == NetworkManager.EventTypes.ObjectInfo) {
                    this.predictionManager
                            .verifyAndFilterInput(event.data, event.data.id);
                }
            }
        }
        this.network.masterSocket.emit("update", payload);
    }

    var replayInputs = function (input) {
        this.position.set(input.data);
    };

    for (i = 0; i < payload.length; i++) {
        playerPayload = payload[i].data;

        if (!playerPayload) {
            continue;
        }

        for (j = 0; j < playerPayload.length; j++) {
            event = playerPayload[j];

            var canSkip = false;
            switch (event.t) {
                case NetworkManager.EventTypes.ObjectInfo:
                    var player = this.characters[event.data.id];

                    if (!this.network.isServer()) {
                        if (event.data.id == this.playerIndex) {
                            var lastVerifiedInput =
                                this.predictionManager.getLastProcessedInput();
                            var inputs = this.predictionManager.getInputs();
                            if (lastVerifiedInput) {
                                player.position.set(lastVerifiedInput);
                            }
                            inputs.forEach(replayInputs.bind(player));
                        } else {
                            var tmp = new Vector();
                            tmp.set(event.data.position);

                            // var differentTargets = (player.target && event.data.target) ? !(player.target.equals(event.data.target)) : true;
                            var allowedPacketTimestamp = (Date.now() -
                                    event.data.timestamp) < 600; // Magic
                            var abovePacketTimestamp = (Date.now() -
                                    event.data.timestamp) > 2000; // Magic

                            var isClosePosition = tmp
                                    .subtract(player.position).length() < 60;

                            if ((abovePacketTimestamp) ||
                                (allowedPacketTimestamp &&
                                !isClosePosition)) {

                                player.position.set(event.data.position);
                            }
                        }
                    } else {
                        player.position.set(event.data.position);
                    }
                    player.velocity.set(event.data.velocity);


                    if (event.data.target &&
                        event.data.id != this.playerIndex) {

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
    if (!deaths || deaths.length === 0) {
        return;
    }
    for (var i = 0; i < deaths.length; i++) {
        var player = this.characters[deaths[i]];
        if (!player.isDead) {
            player.isDead = true;
            if (this.network.isServer()) {
                this.network.sendScores(deaths[i], this.deadCount - 1);
            }
        }
    }
    var allDead = this.deadCount >= this.characters.length - 1;
    if (this.network.isServer() && allDead) {
        var lastManIndex = ArrayUtils.firstIndex(this.characters,
                                                 function (player) {
            return !player.isDead;
        });
        this.network.sendScores(lastManIndex, this.deadCount);
    }
    this.network.pendingDeaths = [];
};

Sanctum.prototype.processAuthoritativeDeaths = function () {
    this.characters.forEach(function (character, characterIndex) {
        if (character.health <= 0 && !character.isDead) {
            this.network.sendDie(characterIndex);
        }
    }.bind(this));
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

    if (this.network.isServer()) {
        this.processAuthoritativeDeaths();
    }

    this.processPendingDeaths();
    if (this.deadCount >= this.characters.length - 1) {
        if (this.currentRound > this.platform.rounds)
            return GameState.gameover;
        else
            return GameState.midround;
    }

    if (!this.network.isServer()) {
        var currentPlayer = this.characters[this.playerIndex];
        if (!currentPlayer.isDead) {
            this.handleInput();
        }

        this.platform.update(delta);
        this.playerManager.update();

        this.ui.update();
    }

    this.physics.update(this.effects.characters);
    this.physics.update(this.effects.activeSpells);

    if (!this.network.isServer()) {
        this.effects.update(delta, this.physics, this.platform, false);
    }

    if (this.network.isServer()) {
        this.effects.update(delta, this.physics, this.platform, true);
    }


    this.network.lastUpdate += delta;
    if (this.network.lastUpdate >= this.network.updateTime) {
        if (!this.network.isServer()) {
            var player = this.characters[this.playerIndex];
            this.predictionManager.addInput(player.position);
            player.inputSequenceNumber =
                    this.predictionManager.inputSequence - 1;
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
    var filteredCharacters = this.characters
        .filter(function (character) {
            return !character.isDead;
        });
    this.renderer.render(delta,
                         [filteredCharacters, this.effects.activeSpells],
                         this.platform,
                         this.characters[this.playerIndex].isDead);
};

Sanctum.prototype.loop = function (timestamp) {
    var delta = (timestamp - this.previousTime) || 1000 / 60;

    this.model.state = this.update(delta);
    if (this.model.state === GameState.midround) {
        Loggers.Debug.log("End of round");
        this.events.roundOver.fire(this);
        return;
    }
    if (this.model.state === GameState.gameover) {
        this.events.gameOver.fire(this);
        if (this.network.isServer()) {
            this.stat.save();
        }
        Loggers.Debug.log("End of game");
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
    this.currentRound++;
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
