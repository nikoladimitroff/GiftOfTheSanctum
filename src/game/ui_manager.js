"use strict";
var GameState = require("./enums").GameState;

var FADE_OUT_MILLISECONDS = 3000;
var MAXIMUM_NUMBER_OF_MESSAGE_BOXES = 5;

var AVATAR_IMAGES = [
    "archer.png", "knight.png", "mage.png", "monk.png",
     "necro.png", "orc.png", "queen.png", "rogue.png"
];

var LogMessage = function () {
    this.message = ko.observable("");
    this.style = ko.observable("");
}

var UIManager = function (viewmodel, events) {
    this.viewmodel = viewmodel;
    this.events = events;
};

UIManager.prototype.init = function (model) {
    this.model = model;
    // Ko.computed are evaluated when their depedencies change but since our
    // scores work differently they won't fire unless we force them
    this.reevaluator = ko.observable();

    this.pushMessageIndex = 0;
    this.viewmodel.messages = [
        new LogMessage(),
        new LogMessage(),
        new LogMessage(),
        new LogMessage(),
        new LogMessage(),
    ];

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

    this.events.gameOver.addEventListener(function () {

    }.bind(this));

    // this.deleteLogMessageFunctions = [];
    // var deleteMessage = function () {
    //     this.viewmodel.messages.shift();
    // }.bind(this);

    this.events.logGameplayMessage.addEventListener(
        function (message, styleClass) {
            if (this.viewmodel.messages[this.pushMessageIndex].message().length === 0) {
                this.viewmodel.messages[this.pushMessageIndex].message(message);
                this.viewmodel.messages[this.pushMessageIndex].style(styleClass);
                var i = this.pushMessageIndex;
                setTimeout(function () {
                        this.viewmodel.messages[i].message("");
                    }.bind(this), FADE_OUT_MILLISECONDS);
                this.pushMessageIndex++;
                if (this.pushMessageIndex >= MAXIMUM_NUMBER_OF_MESSAGE_BOXES) {
                    this.pushMessageIndex = 0;
                }
            }
            // for (var i = 0; i < this.viewmodel.messages.length; i++) {
            //     if (this.viewmodel.messages[i].message().length === 0) {
            //         this.viewmodel.messages[i].message(message);
            //         this.viewmodel.messages[i].style(styleClass);
            //         setTimeout(function () {
            //             this.viewmodel.messages[i].message("");
            //         }.bind(this), FADE_OUT_MILLISECONDS);
            //         break;
            //     }
            // }

            // this.viewmodel.messages.push({
            //     message: message,
            //     style: styleClass
            // });

            // if (this.viewmodel.messages().length >=
            //     MAXIMUM_NUMBER_OF_MESSAGE_BOXES) {
            //     window.clearTimeout(this.deleteLogMessageFunctions.pop());
            //     deleteMessage();
            // }

            // this.deleteLogMessageFunctions
            //     .push(window.setTimeout(deleteMessage,
            //                             FADE_OUT_MILLISECONDS));
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
