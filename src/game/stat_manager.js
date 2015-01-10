"use strict";
// Require request dynamically so that browserify doesn't
// build it in the game client.
var request = eval("require('request')"); /* jshint ignore: line */

var StatManager = function () {
    this.gameOverAPI = "https://gift-of-the-sanctum.azure-mobile.net" +
                       "/api/game_over";
};

StatManager.prototype.init = function (characters) {
    this.characters = characters;
    this.stats = characters.reduce(function (stats, character) {
        stats[character.name] = {};
        return stats;
    }, {});
    var now = new Date();
    var nowUtc = new Date(now.getUTCFullYear(), now.getUTCMonth(),
                           now.getUTCDate(), now.getUTCHours(),
                           now.getUTCMinutes(), now.getUTCSeconds());
    this.timestamp = nowUtc;
};

function getSpellsFromStats(stats) {
    return Object.keys(stats).filter(function (prop) {
        return prop !== "azureId" && prop !== "finishingPlace";
    });
}

function getSpellCastsDictionary(spells, stats) {
    return spells.reduce(function (casts, spell) {
        casts[spell] = stats[spell];
        return casts;
    }, {});
}

StatManager.prototype.onSpellcast = function (characterId, spell) {
    var name = this.characters[characterId].name;
    if (this.stats[name][spell] === undefined)
        this.stats[name][spell] = 0;
    this.stats[name][spell]++;
};

StatManager.prototype.save = function (playerToAzureId) {
    this.characters.sort(function (c1, c2) {
        return c1.score - c2.score;
    });
    for (var i = 0; i < this.characters.length; i++) {
        var characterName = this.characters[i].name;
        this.stats[characterName].finishingPlace = i;
        this.stats[characterName].azureId = this.characters[i].azureId;
    }
    var dbData = [];
    for (var character in this.stats) {
        if (playerToAzureId[character] !== undefined) {
            var spellList = getSpellsFromStats(this.stats[character]);
            var stats = this.stats[character];
            var spellCasts = getSpellCastsDictionary(spellList, stats);
            dbData.push({
                id: playerToAzureId[character],
                finishedPlace: this.stats[character].finishingPlace,
                spellsCast: JSON.stringify(spellCasts)
            });
        }
    }
    this.uploadGameOverData(dbData);
};

StatManager.prototype.uploadGameOverData = function (dbdata) {
    request({
        method: "POST",
        uri: this.gameOverAPI,
        body: JSON.stringify(dbdata)
    }, function (error, response, body) {
        if (response.statusCode == 200) {
            console.log("Successfully updated stats!");
        } else {
            console.log("Error on updating stats: ", response.statusCode);
            console.log(body);
        }
    });
};

module.exports = StatManager;
