"use strict";
/* global Sanctum */
var utils = {
    objectValues: function (obj) {
        return Object.keys(obj).map(function (k) { return obj[k]; });
    },
    objectWithProperties: function (properties) {
        return properties.reduce(function (obj, prop) {
            obj[prop] = ko.observable();
            return obj;
        }, {});
    },
    conditionalClone: function (obj, properties, result) {
        result = result || {};
        return properties.reduce(function (clone, prop) {
            if (typeof clone[prop] === "object") {
                utils.conditionalClone(obj[prop],
                                       Object.keys(obj[prop]),
                                       clone[prop]);
            }
            else {
                clone[prop] = obj[prop];
            }
            return clone;
        }, result);
    },
    fixStringNumbers: function (obj) {
        for (var prop in obj) {
            if (typeof obj[prop] === "object") {
                utils.fixStringNumbers(obj[prop]);
            }
            else if (typeof obj[prop] === "string" &&
                obj[prop] !== "" &&
                !isNaN(obj[prop])) {

                obj[prop] = +obj[prop];
            }
        }
    },
};

var ObservableVector = function (x, y) {
    this.x = ko.observable(x);
    this.y = ko.observable(y);
};

var Viewmodel = function (game) {
    this.game = game;
    this.constants = {
        movementFunctions: [
            "linear",
            "quadratic"
        ],
        castTypes: [
            "projectile",
            "instant"
        ],
        effects: {
            damage: "damageAmount",
            pushback: "pushbackForce"
        },
        spellnames: Object.keys(game.effects.spellLibrary)
    };

    this.name = ko.observable(this.constants.spellnames[0]);
    this.icon = ko.computed(function () {
        return "../content/art/spells/icons/" +
               this.name().toLowerCase().replace(/ /g, "_") + ".png";
    }.bind(this));
    this.description = ko.observable();
    this.size = new ObservableVector();
    this.initialVelocity = ko.observable();
    this.initialAcceleration = ko.observable();
    this.width = ko.observable();
    this.height = ko.observable();
    this.castType = ko.observable();
    this.duration = ko.observable();
    this.cooldown = ko.observable();
    this.movementFunction = ko.observable();
    this.range = ko.observable();

    this.effectRadius = ko.observable();
    this.effects = ko.observableArray();
    this.missingEffects = ko.computed(function () {
        var effectsInUse = this.effects().map(function (e) { return e.name; });
        return Object.keys(this.constants.effects).filter(function (effect) {
            return effectsInUse.indexOf(effect) === -1;
        });
    }.bind(this));

    this.selectedEffect = ko.observable();

    this.name.subscribe(this.importSpell.bind(this));
    this.importSpell();
    this.exported = ko.computed(function () {
        // The viewmodel has changed, update the game
        var model = this.export();
        this.updateSpellLibrary(model);
        return JSON.stringify(model).replace(/,/g, ",\n")
                                    .replace(/:/g, ": ")
                                    .replace(/\{/g, "{\n")
                                    .replace(/\}/g, "\n}")
                                    .replace(/\[/g, "[\n")
                                    .replace(/\]/g, "\n]");
    }.bind(this));
};

var PROPERTIES_TO_EXPORT = [
    "name",
    "description",
    "size",
    "initialAcceleration",
    "initialVelocity",
    "castType",
    "duration",
    "cooldown",
    "movementFunction",
    "range",
    "effectRadius",
    "effects",
    "damageAmount",
    "pushbackForce"
];

var PROPERTIES_TO_IMPORT = [
    "description",
    "size",
    "initialAcceleration",
    "initialVelocity",
    "castType",
    "duration",
    "cooldown",
    "movementFunction",
    "range",
    "effectRadius",
];

Viewmodel.prototype = {
    importSpell: function () {
        this.importingSpell = true;

        var spell = this.game.effects.spellLibrary[this.name()];

        for (var i = 0; i < PROPERTIES_TO_IMPORT.length; i++) {
            var prop = PROPERTIES_TO_IMPORT[i];
            if (this[prop] instanceof ObservableVector) {
                this[prop].x(spell[prop].x);
                this[prop].y(spell[prop].y);
            }
            else {
                this[prop](spell[prop]);
            }
        }

        this.effects.removeAll();
        var usedEffects = spell.effects;
        for (i = 0; i < usedEffects.length; i++) {
            var propertyName = this.constants.effects[usedEffects[i]];
            this.addEffect(usedEffects[i], spell[propertyName]);
        }

        this.game.bindSpells(this.name());

        this.importingSpell = false;
    },
    addEffect: function (effect, initialValue) {
        effect = effect || this.selectedEffect();
        initialValue = initialValue || 0;
        this.effects.push({
            name: effect,
            property: {
                name: this.constants.effects[effect],
                value: ko.observable(initialValue)
            }
        });
    },
    removeEffect: function (effect) {
        this.effects.remove(function (e) {
            return e.name === effect;
        });
    },
    resetGame: function () {
        this.game.forceStop();
        this.game.reset();
        this.game.run();
    },
    exportEffectProperties: function (model) {
        var usedEffects = model.effects;
        for (var i = 0; i < usedEffects.length; i++) {
            var effect = usedEffects[i];
            usedEffects[i] = usedEffects[i].name;
            model[effect.property.name] = effect.property.value || 0;
        }
    },
    export: function () {
        var model = ko.toJS(utils.conditionalClone(this, PROPERTIES_TO_EXPORT));
        this.exportEffectProperties(model);
        utils.fixStringNumbers(model);
        return model;
    },
    updateSpellLibrary: function (model) {
        if (!this.importingSpell) {
            utils.conditionalClone(model,
                                   PROPERTIES_TO_EXPORT,
                                   this.game.effects.spellLibrary[model.name]);
        }
    },
};


function main() {
    var canvas = document.getElementById("editor-canvas");
    var context = canvas.getContext("2d");
    var players = ["editor-player", "enemy1", "enemy2", "enemy3"];
    var options = {
        inEditor: true
    };
    var game = Sanctum.startNewGame(players, 0, null, null, context, options);


    game.events.initializationComplete.addEventListener(function () {
        var viewmodel = new Viewmodel(game);
        ko.applyBindings(viewmodel);

        window.vm = viewmodel;
    });
}

main();
