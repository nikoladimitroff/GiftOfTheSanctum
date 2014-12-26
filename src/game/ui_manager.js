"use strict";
var GameState = require("./enums").GameState;


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

    // Add whatever else the viewmodel needs
    var players = this.viewmodel.players();
    for (var i = 0; i < players.length; i++) {
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
        this.viewmodel.boundSpells[i] = {
            name: ko.computed(function (i) {
                this.reevaluator();
                return this.model.boundSpells[i];
            }.bind(this, i)),
            key: ko.computed(function (i) {
                this.reevaluator();
                return this.model.keybindings["spellcast" + i];
            }.bind(this, i)),
            icon: ko.computed(function (i) {
                this.reevaluator();
                return "url(" +
                       this.model.getSpellIcon(this.model.boundSpells[i]) +
                       ")";
            }.bind(this, i)),
            remainingCooldown: ko.computed(function (i) {
                this.reevaluator();
                var spellName = this.model.boundSpells[i];
                return this.model.getSpellRemainingCooldown(spellName);
            }.bind(this, i)),
            cooldownPercentage: ko.computed(function (i) {
                this.reevaluator();
                var spellName = this.model.boundSpells[i];
                return this.model.getSpellCoolingPercentage(spellName);
            }.bind(this, i))
        };
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
    ko.applyBindings(this.viewmodel, document.getElementById("game-ui"));

    this.events.roundOver.addEventListener(function () {
        this.update();
        this.toggleScoreboard();
    }.bind(this));
    this.bindUI();
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
