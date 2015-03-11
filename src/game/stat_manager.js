"use strict";
// Dynamic require due to browserify
var http = eval("require('https')"); // jshint ignore: line
var Loggers = require("../utils/logger");
var Callbacker = require("../utils/callbacker");
var utcNow = require("../utils/general_utils").utcNow;

var StatManager = function () {
    this.serviceUrl = "gift-of-the-sanctum.azure-mobile.net";
    this.userStatsPath = "/tables/user_statistics";
};

StatManager.prototype.init = function (characters, achievements) {
    this.characters = characters;
    this.achievements = achievements;
    this.stats = characters.reduce(function (stats, character) {
        stats[character.name] = {
            spellsCast: {},
            placeFinished: -1,
            azureId: character.azureId
        };
        return stats;
    }, {});
    this.timestamp = utcNow();

    Loggers.Debug.log("Stat manager initialized with: {0}",
                      Loggers.asJSON(achievements));
};

StatManager.prototype.onSpellcast = function (characterId, spell) {
    var name = this.characters[characterId].name;
    if (this.stats[name].spellsCast[spell] === undefined)
        this.stats[name].spellsCast[spell] = 0;
    this.stats[name].spellsCast[spell]++;
};

StatManager.prototype.save = function () {
    Loggers.Debug.log("Saving stats");
    this.characters.sort(function (c1, c2) {
        return c1.score - c2.score;
    });
    for (var i = 0; i < this.characters.length; i++) {
        var characterName = this.characters[i].name;
        this.stats[characterName].placeFinished = i;
    }
    this.sendRequest();
};

// This is the easiest way to deal with jshint's
// rule against snake_casing
var TABLE_COLUMN = {
    placesFinished: "places_finished",
    spellsCast: "spells_cast",
    achievementsEarned: "achievements_earned"
};

var getUserUpdateCallback = function (callbacker,
                                      upload,
                                      gameStats,
                                      allAchievements) {

    return function (serverStats) {
        serverStats = JSON.parse(serverStats)[0];
        var totalSpells = JSON.parse(serverStats[TABLE_COLUMN.spellsCast]) ||
                          {};
        var gameSpells = gameStats.spellsCast;
        Object.keys(gameSpells).forEach(function (spell) {
            if (totalSpells[spell] === undefined)
                totalSpells[spell] = 0;
            totalSpells[spell] += gameSpells[spell];
        });
        var unparsedPlaces = serverStats[TABLE_COLUMN.placesFinished];
        var totalPlaces = JSON.parse(unparsedPlaces) || [];
        var place = gameStats.placeFinished;
        if (totalPlaces[place] === undefined) {
            totalPlaces[place] = 0;
        }
        totalPlaces[place]++;

        // Check for achievements
        var unparsedAchievs = serverStats[TABLE_COLUMN.achievementsEarned];
        var totalAchievements = JSON.parse(unparsedAchievs) ||
                                {};

        var parsedServerStats = {
            spellsCast: totalSpells,
            placesFinished: totalPlaces,
            achievementsEarned: totalAchievements
        };
        for (var name in allAchievements) {
            var achievement = allAchievements[name];
            if (!totalAchievements[name]) {
                var isAchieved = false;
                try {
                    isAchieved = achievement.requirements(gameStats,
                                                          parsedServerStats);
                }
                catch (e) {
                    Loggers.Debug.error("Error with the predicate of" +
                                        "achievement: {0}. Error: {1}." ,
                                        name, e);
                }
                if (isAchieved) {
                    totalAchievements[name] = utcNow();
                    Loggers.Debug.log("Achievement earned: ", name);
                }
            }
        }
        serverStats[TABLE_COLUMN.placesFinished] =
            JSON.stringify(totalPlaces);
        serverStats[TABLE_COLUMN.spellsCast] =
            JSON.stringify(totalSpells);
        serverStats[TABLE_COLUMN.achievementsEarned] =
            JSON.stringify(totalAchievements);
        upload(serverStats, callbacker.success, callbacker.error);
    };
};

StatManager.prototype.sendRequest = function () {
    var callbacks = new Callbacker(null, null, function (succeeded, failed) {
        Loggers.Debug.log("After game update complete: " +
                    succeeded + " succeeded, " +
                    failed + " failed.");
    });

    var uploadUserData = this.uploadUserData.bind(this);
    for (var i = 0; i < this.characters.length; i++) {
        var gameStats = this.stats[this.characters[i].name];
        if (!gameStats.azureId)
            continue;
        callbacks.attempts++;
        var updateStats = getUserUpdateCallback(callbacks,
                                                uploadUserData,
                                                gameStats,
                                                this.achievements);
        this.lookupUserData(gameStats.azureId, updateStats, callbacks.error);
    }
};

var HEADERS = {
    Accept: "application/json",
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
