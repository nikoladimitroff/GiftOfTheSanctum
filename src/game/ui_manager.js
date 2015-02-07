"use strict";
var GameState = require("./enums").GameState;
var Loggers = require("../utils/logger.js");

var AVATAR_IMAGES = [
    "archer.png", "knight.png", "mage.png", "monk.png",
     "necro.png", "orc.png", "queen.png", "rogue.png"
];

var UIManager = function (viewmodel, events) {
    this.viewmodel = viewmodel;
    this.events = events;
};

UIManager.prototype.init = function (model) {
    this.model = model;
    // Ko.computed are evaluated when their depedencies change but since our
    // scores work differently they won't fire unless we force them
    this.reevaluator = ko.observable();

    var precomputeLoggerMessages = function (i) {
        this.reevaluator();
        return Loggers.GameplayLogger.messages[i];
    };

    this.viewmodel.messages = [];
    for (var i = 0;
         i < Loggers.GameplayLogger.MAXIMUM_NUMBER_OF_MESSAGES;
         i++) {
        this.viewmodel.messages[i] = ko.computed(
            precomputeLoggerMessages.bind(this, i));
    }

    // Add whatever else the viewmodel needs
    var players = this.viewmodel.players();
    for (i = 0; i < players.length; i++) {
        players[i].score = ko.computed(function (i) {
            this.reevaluator();
            return this.model.characters[i].score;
        }.bind(this, i));
    }
    this.viewmodel.scoreboardAvatars = AVATAR_IMAGES.map(function (path) {
        return "content/art/characters/scoreboard/" + path;
    });
    this.viewmodel.boundSpells = [];
    for (i = 0; i < 6; /* Magic */ i++) {
        this.viewmodel.boundSpells[i] = this.getSpellDatabinding(i);
    }
    this.viewmodel.showScoreboard = ko.observable(false);
    this.viewmodel.canStartNextRound = ko.computed(function () {
        this.reevaluator();
        return this.viewmodel.isHost() &&
               this.model.state === GameState.midround;
    }.bind(this));

    this.viewmodel.isGameMidround = ko.computed(function () {
        this.reevaluator();
        return this.model.state === GameState.midround;
    }.bind(this));

    // Rebind
    var gameUI = document.getElementById("game-ui");
    ko.applyBindings(this.viewmodel, gameUI);
    // Disable right-clicking the game ui
    gameUI.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    }, false);

    this.events.roundOver.addEventListener(function () {
        this.update();
        this.toggleScoreboard();
    }.bind(this));

    this.bindUI();
};

UIManager.prototype.getSpellDatabinding = function (i) {
    return {
        name: ko.computed(function () {
            this.reevaluator();
            return this.model.boundSpells[i];
        }.bind(this)),
        key: ko.computed(function () {
            this.reevaluator();
            return this.model.keybindings["spellcast" + i];
        }.bind(this)),
        icon: ko.computed(function () {
            this.reevaluator();
            return "url(" +
                   this.model.getSpellIcon(this.model.boundSpells[i]) +
                   ")";
        }.bind(this)),
        description: ko.computed(function () {
            this.reevaluator();
            var spellName = this.model.boundSpells[i];
            return this.model.getSpellDescription(spellName);
        }.bind(this, i)),
        damage: ko.computed(function () {
            this.reevaluator();
            return this.model.getSpellDamage(this.model.boundSpells[i]);
        }.bind(this)),
        cooldown: ko.computed(function () {
            this.reevaluator();
            var spellName = this.model.boundSpells[i];
            return this.model.getSpellCooldown(spellName) / 1000;
        }.bind(this)),
        remainingCooldown: ko.computed(function () {
            this.reevaluator();
            var spellName = this.model.boundSpells[i];
            return this.model.getSpellRemainingCooldown(spellName);
        }.bind(this)),
        cooldownPercentage: ko.computed(function () {
            this.reevaluator();
            var spellName = this.model.boundSpells[i];
            return this.model.getSpellCoolingPercentage(spellName);
        }.bind(this))
    };
};

UIManager.prototype.bindUI = function () {
    document.getElementById("next-round-button")
    .addEventListener("click", function () {
        if (this.viewmodel.canStartNextRound()) {
            this.events.nextRound.fire(this);
        }
    }.bind(this));
};

UIManager.prototype.update = function () {
    // Force update
    this.reevaluator.notifySubscribers();
    this.viewmodel.players.sort(function (p1, p2) {
        return p1.score - p2.score;
    });
};

UIManager.prototype.toggleScoreboard = function () {
    this.viewmodel.showScoreboard(!this.viewmodel.showScoreboard());
};

module.exports = UIManager;
