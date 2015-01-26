"use strict";
// Dynamic require due to browserify
var http = eval("require('https')");

var StatManager = function () {
    this.serviceUrl = "gift-of-the-sanctum.azure-mobile.net";
    this.userStatsPath = "/tables/user_statistics";
};

StatManager.prototype.init = function (characters) {
    this.characters = characters;
    this.stats = characters.reduce(function (stats, character) {
        stats[character.name] = {
            spellsCast: {},
            finishedPlace: -1,
            azureId: character.azureId
        };
        return stats;
    }, {});
    var now = new Date();
    var nowUtc = new Date(now.getUTCFullYear(), now.getUTCMonth(),
                           now.getUTCDate(), now.getUTCHours(),
                           now.getUTCMinutes(), now.getUTCSeconds());
    this.timestamp = nowUtc;
};

StatManager.prototype.onSpellcast = function (characterId, spell) {
    var name = this.characters[characterId].name;
    if (this.stats[name].spellsCast[spell] === undefined)
        this.stats[name].spellsCast[spell] = 0;
    this.stats[name].spellsCast[spell]++;
    console.log("sp: ", name, spell, this.stats);
};

StatManager.prototype.save = function () {
    console.log("Saving stats");
    this.characters.sort(function (c1, c2) {
        return c1.score - c2.score;
    });
    for (var i = 0; i < this.characters.length; i++) {
        var characterName = this.characters[i].name;
        this.stats[characterName].placeFinished = i;
    }
    this.sendRequest();
};

StatManager.prototype.sendRequest = function () {
    var userStats = this.userStats;
    var successes = 0,
        failures = 0;
    console.log("Will now send update request");
    var ondone = function () {
        if (successes + failures == this.stats.length) {
            console.log("After game update complete: " +
                        successes + " succeeded, " +
                        failures + " failed.");
        }
    }.bind(this);
    var onerror = function (e) {
        failures++;
        console.error("Something failed", e);
        ondone();
    };
    var onsuccess = function () {
        successes++;
        console.log("Something succeeded");
        ondone();
    };
    var uploadUserData = this.uploadUserData.bind(this);
    for (var i = 0; i < this.characters.length; i++) {
        var gameStats = this.stats[this.characters[i].name];
        if (!gameStats.azureId)
            continue;
        console.log("stating", i, gameStats.azureId);
        var updateStats = function (serverStats) {
            console.log("updating stats", serverStats, gameStats);
            serverStats = JSON.parse(serverStats)[0];
            var currentSpells = JSON.parse(serverStats.spells_cast) || {},
                gameSpells = gameStats.spellsCast;
            Object.keys(gameSpells).forEach(function (spell) {
                if (currentSpells[spell] === undefined)
                    currentSpells[spell] = 0;
                currentSpells[spell] += gameSpells[spell];
            });
            var places = JSON.parse(serverStats.places_finished) || [];
            var place = gameStats.placeFinished;
            if (places[place] === undefined)
                places[place] = 0;
            places[place]++;
            
            serverStats.places_finished = JSON.stringify(places);
            serverStats.spells_cast = JSON.stringify(currentSpells);
            // Check for achievements
            console.log("sending", serverStats);
            uploadUserData(stats, onsuccess, onerror);
        }
        this.lookupUserData(serverStats.azureId, updateStats, onerror);
    }
};

var HEADERS = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    
    // Application key
    "X-ZUMO-APPLICATION": "sEKFgdNxpYZpJSTOfUYaxOntbHmJDY70",
};
StatManager.prototype.lookupUserData = function (id, complete, error) {
    var options = {
        hostname: this.serviceUrl,
        path: this.userStatsPath, // + "?$filter=(id eq " + id + ")",
        headers: HEADERS,
        method: "GET"
    };

    var request = http.request(options, function (response) {
        response.setEncoding("utf8");
        response.on("data", complete);
    });
    request.on("error", error);

    request.end();
};

StatManager.prototype.uploadUserData = function (data, complete, error) {
    var options = {
        hostname: this.serviceUrl,
        path: this.userStatsPath + "/" + data.id,
        headers: HEADERS,
        method: "PATCH"
    };

    var request = http.request(options, function (response) {
        response.setEncoding("utf8");
        response.on("data", complete);
    });
    request.on("error", error);

    request.write(JSON.stringify(data));
    request.end();    
};

module.exports = StatManager;
