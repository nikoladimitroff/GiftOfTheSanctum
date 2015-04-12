"use strict";
var Loggers = require("../utils/logger");
var SanctumEvent = require("../utils/sanctum_event.js");
var ArrayUtils = require("../utils/array_utils");
var stub = require("../utils/stub.js");
var nowUTC = require("../utils/general_utils").nowUTC;

var PhysicsManager = require("./physics_manager");
var EffectManager = require("./effect_manager");
var InputManager = require("./input_manager");
var Renderer = require("./renderer");
var AudioManager = require("./audio_manager");
var ContentManager = require("./content_manager");
var UIManager = require("./ui_manager");
var PlayerManager = require("./player_manager");
var NetworkManager = require("./network_manager");
var PredictionManager = require("./prediction_manager");

var ArrowPointerAnimation = require("./programmed_animations").ArrowPointer;

var GameState = require("./enums").GameState,
    Action = require("./enums").Action;
var Camera = require("./camera");
var Vector = require("./math/vector");

var SPELLCAST_COUNT = 6;

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
        initializationComplete: new SanctumEvent(),
        roundOver: new SanctumEvent(),
        gameOver: new SanctumEvent(),
        endGame: new SanctumEvent(),
    };


    // Server / client specializations
    // @ifdef PLATFORM_SERVER
    var StatManager = require("./stat_manager");
    this.stat = new StatManager();
    networkManager.recorder = this.stat;
    // @endif
    // @ifndef PLATFORM_SERVER
    this.playerLoadingProgress = playerNames.map(function () {
        return 0;
    });

    this.input = new InputManager();
    this.audio = new AudioManager();
    this.renderer = new Renderer(context,
                                 options.debug,
                                 options.autoresize);
    this.playerTargetAnimation = null;
    this.ui = new UIManager(viewmodel, this.events);
    // @endif

    // Event handlers
    this.network.events.scoresInfo.addEventListener(function (_, score, index) {
        this.characters[index].score += score;
        // @ifndef PLATFORM_SERVER
        this.ui.update();
        // @endif
    }.bind(this));

    this.network.events.nextRound.addEventListener(function (/* sender */) {
        // The network manager received a "next-round" command
        this.reset();
        this.run();
    }.bind(this));

    // @ifndef PLATFORM_SERVER
    this.ui.events.nextRound.addEventListener(function (/* sender */) {
        // The next round button has been clicked
        this.network.sendNextRound();
    }.bind(this));
    // @endif

    this.network.events.partlyContentLoaded.addEventListener(function (sender,
                                                               progress,
                                                               playerIndex) {
        this.playerLoadingProgress[playerIndex] = progress;
        var gameReady = this.playerLoadingProgress.every(function (progress) {
            return progress >= 1;
        });
        if (gameReady) {
            this.init();
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

        // @ifdef PLATFORM_SERVER
        player.name = playerData.name;
        player.id = playerData.id;
        player.azureId = playerData.azureId;
        // @endif
        // @ifndef PLATFORM_SERVER
        player.name = playerData;
        // @endif

        player.position = positions[i];
        this.characters.push(player);
    }

    var spellLibrary = this.content.getSpellLibrary();

    this.effects.init(spellLibrary, this.characters, this.platform);

    // @ifdef PLATFORM_SERVER
    this.stat.init(this.characters, this.content.getAchievementLibrary());
    // @endif
    // @ifndef PLATFORM_SERVER
    var outlining = this.platform.playerOutlining;
    this.characters[this.playerIndex].outlining = outlining;
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
        playerIndex: this.playerIndex,
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
    // @endif
    this.events.initializationComplete.fire(this);
    this.run(0);
};

Sanctum.prototype.loadContent = function () {
    // @ifndef PLATFORM_SERVER
    var characters = [];
    for (var i = 0; i < this.characters.length; i++) {
        characters[i] = this.content.get(CHARACTERS[i]);
        characters[i].name = this.characters[i];
    }
    var backgroundPath = "content/art/environment/forest2.png";
    this.ui.showLoadingScreen(characters,
                              this.playerIndex,
                              this.content.get(backgroundPath).image,
                              this.playerLoadingProgress);
    // @endif
    var progressUpdate = function (progress) {
        this.playerLoadingProgress[this.playerIndex] = progress;
        this.network.sendPartlyContentLoaded(progress);
    };

    var rejectedCallback = function (error) {
        Loggers.Debug.error("Could not load the game content: {0}", error);
    };
    // @ifdef PLATFORM_SERVER
    this.content.loadGameData("game_data.json")
    .done(this.init.bind(this), rejectedCallback, undefined);
    // @endif
    // @ifndef PLATFORM_SERVER
    this.content.loadGameData("game_data.json")
    .done(undefined, rejectedCallback, progressUpdate.bind(this));
    // @endif

};

Sanctum.prototype.reset = function () {
    Loggers.Debug.log("Round reset.");
    this.platform.reset();
    var center = this.platform.size.divide(2);
    var positions = this.platform.generateVertices(this.characters.length,
                                                   150, // Magic
                                                   center);

    for (var i = 0; i < this.characters.length; i++) {
        var player = this.characters[i];
        player.position = positions[i];
        player.velocity.set(Vector.zero);
        player.acceleration.set(Vector.zero);
        player.destination = null;
        player.health = player.startingHealth;
        player.isDead = false;
    }
    this.model.state = GameState.midround;
    this.previousTime = 0;
    this.effects.reset();
    this.network.resetRound();
    this.spells = [];
    // @ifndef PLATFORM_SERVER
    this.ui.viewmodel.showScoreboard(false);
    // @endif
};

Sanctum.prototype.handleInput = function () {
    for (var i = 0; i < SPELLCAST_COUNT; i++) {
        var action = "spellcast" + i;
        var key = this.keybindings[action];
        if (this.input.keyboard[this.input.keynameToCode(key)]) {
            this.nextAction = Action[action];
        }
    }

    var player = this.characters[this.playerIndex];
    if (this.input.mouse.right &&
        !this.input.previousMouse.right) {

        var destination = this.input.mouse.absolute.clone();
        this.playerManager.moveTo(player, destination);
        var direction = destination.subtract(player.position).normalized();
        player.playAnimation(Action.walk, direction);
        this.audio.play(player.voice.move);
        var options = this.platform.arrowPointerOptions;
        var animation = new ArrowPointerAnimation(options, destination);
        this.playerTargetAnimation = animation;
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

Sanctum.prototype.getVerifiedNetworkData = function () {
    var payload = [];
    var payloadPerPlayer, i;

    for (i = 0; i < this.characters.length; i++) {
        payload.push({
            id: i,
            data: this.network.getLastUpdateFrom(i)
        });
    }

    payload = payload.filter(function (item) {
        return item.data !== null;
    });

    // @ifdef PLATFORM_SERVER
    var verifyInput = function (event) {
        if (event.t == NetworkManager.EventTypes.ObjectInfo) {
            this.predictionManager
                .verifyInput(event.data, event.data.id);
        }
    }.bind(this);

    for (i = 0; i < payload.length; i++) {
        payloadPerPlayer = payload[i].data;

        if (!payloadPerPlayer) {
            continue;
        }

        payloadPerPlayer.forEach(verifyInput);
    }
    // @endif

    return payload;
};

Sanctum.prototype.processNetworkData = function (payload) {
    var i, j, payloadPerPlayer, event;

    for (i = 0; i < payload.length; i++) {
        payloadPerPlayer = payload[i].data;

        if (!payloadPerPlayer) {
            continue;
        }

        for (j = 0; j < payloadPerPlayer.length; j++) {
            event = payloadPerPlayer[j];

            var canSkip = false;
            switch (event.t) {
                case NetworkManager.EventTypes.ObjectInfo:
                    var player = this.characters[event.data.id];

                    // @ifdef PLATFORM_SERVER
                    player.position.set(event.data.position);
                    // @endif
                    // @ifndef PLATFORM_SERVER
                    this.predictionManager
                    .predictPlayerMovement(player, event, this.playerIndex);

                    if (event.data.id == this.playerIndex) {
                        this.model.latency = nowUTC() - event.data.timestamp;
                    }
                    // @endif
                    player.velocity.set(event.data.velocity);

                    if (event.data.destination &&
                        event.data.id != this.playerIndex) {
                        var destX = event.data.destination.x,
                            destY = event.data.destination.y;
                        player.destination = new Vector(destX, destY);
                    }
                    break;

                case NetworkManager.EventTypes.Spellcast:
                    canSkip = event.data.caster == this.playerIndex;
                    if (canSkip) {
                        continue;
                    }

                    var destination = new Vector(event.data.destination.x,
                                                 event.data.destination.y);

                    this.effects.castSpell(event.data.caster,
                                           event.data.spellName,
                                           destination);
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
            player.health = 0;
            // @ifdef PLATFORM_SERVER
            this.network.sendScores(deaths[i], this.deadCount - 1);
            // @endif
        }
    }

    var allDead = this.deadCount >= this.characters.length - 1;
    // @ifdef PLATFORM_SERVER
    if (allDead) {
        var lastManIndex = ArrayUtils.firstIndex(this.characters,
                                                 function (player) {
            return !player.isDead;
        });
        if (lastManIndex !== null) {
            this.network.sendScores(lastManIndex, this.deadCount);
        }
    }
    // this.network.pendingDeaths = [];
    // @endif
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
    var verifiedNetworkData = this.getVerifiedNetworkData();
    // @ifdef PLATFORM_SERVER
    this.network.masterSocket.emit("update", verifiedNetworkData);
    // @endif
    this.processNetworkData(verifiedNetworkData);

    // @ifdef PLATFORM_SERVER
    this.processAuthoritativeDeaths();
    // @endif

    this.processPendingDeaths();
    if (this.deadCount >= this.characters.length - 1) {
        if (this.currentRound > this.platform.rounds)
            return GameState.gameover;
        else
            return GameState.midround;
    }

    // @ifndef PLATFORM_SERVER
    var currentPlayer = this.characters[this.playerIndex];
    if (!currentPlayer.isDead) {
        this.handleInput();
    }

    this.playerManager.update();
    this.ui.update();
    // @endif

    this.physics.update(this.effects.characters);
    this.physics.update(this.effects.activeSpells);

    this.platform.update(delta);
    this.effects.update(delta, this.physics, this.platform);

    this.network.lastUpdate += delta;
    if (this.network.lastUpdate >= this.network.updateTime) {
        // @ifndef PLATFORM_SERVER
        var player = this.characters[this.playerIndex];
        this.predictionManager.addInput(player.position);
        player.inputSequenceNumber = this.predictionManager.inputSequence - 1;

        this.network.addObject(player, this.playerIndex);
        this.network.flush(this.playerIndex);
        // @endif
        this.network.lastUpdate = 0;
    }

    return GameState.playing;
};

Sanctum.prototype.render = function (delta) {
    var currentPlayer = this.characters[this.playerIndex];
    var following = !currentPlayer.isDead ?
                    this.playerIndex : this.getMaxScorePlayerIndex();
    this.renderer.camera.follow(this.characters[following].position);

    var livingCharacters = this.characters
        .filter(function (character) {
            return !character.isDead;
        });
    var animations = [];
    if (this.characters[this.playerIndex].destination === null) {
        this.playerTargetAnimation = null;
    }
    if (this.playerTargetAnimation !== null) {
        animations.push(this.playerTargetAnimation);
    }
    this.renderer.render(delta,
                         [livingCharacters, this.effects.activeSpells],
                         animations,
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
        // @ifdef PLATFORM_SERVER
        this.stat.save();
        // @endif
        Loggers.Debug.log("End of game");
        return;
    }

    // @ifndef PLATFORM_SERVER
    this.render(delta);
    // @endif

    this.previousTime = timestamp;
    // @ifdef PLATFORM_SERVER
    this.timeoutId = setTimeout(this.mainSanctumLoop, 1000 / 60);
    // @endif
    // @ifndef PLATFORM_SERVER
    this.timeoutId = requestAnimationFrame(this.mainSanctumLoop);
    // @endif
};

Sanctum.prototype.forceStop = function () {
    // @ifdef PLATFORM_SERVER
    clearTimeout(this.timeoutId);
    // @endif
    // @ifndef PLATFORM_SERVER
    cancelAnimationFrame(this.timeoutId);
    // @endif
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
    // @ifdef PLATFORM_SERVER
    this.mainSanctumLoop = this.loop.bind(this, 1000 / 60);
    // @endif
    // @ifndef PLATFORM_SERVER
    this.mainSanctumLoop = this.loop.bind(this);
    // @endif

    this.model.state = GameState.playing;
    this.currentRound++;
    this.mainSanctumLoop(0);
};

Sanctum.createNewGame = function (players, selfIndex, networkManager,
                                  viewmodel, context, options) {
    var game = new Sanctum(players,
                           selfIndex,
                           networkManager,
                           viewmodel,
                           context,
                           options);
    var start = function () {
        game.loadContent();
        game.bindSpells("Fireball", "Frostfire", "Heal",
                        "Flamestrike", "Electric bolt", "Deathbolt");
        Sanctum.activeGame = game;
    };
    // @ifdef PLATFORM_SERVER
    start();
    // @endif
    // @ifndef PLATFORM_SERVER
    game.content.loadPregameData("loading_screen_sprites.json",
                                 "characters.json",
                                 "art/environment/forest2.png")
    .done(start);
    // @endif
    return game;
};

module.exports = Sanctum;
global.Sanctum = Sanctum;
