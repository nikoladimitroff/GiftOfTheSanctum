"use strict";

var Loggers = require("../utils/logger");
var Achievement = require("../game/game_objects").Achievement;

var AchievementsController = function () {
    this.client = null;
};

function prepareAchievements(viewmodel, achievementCategories, earned) {
    var total = 0;
    for (var i = 0; i < achievementCategories.length; i++) {
        var category = achievementCategories[i];
        total += category.achievements.length;
        for (var j = 0; j < category.achievements.length; j++) {
            var achievement = new Achievement(category.achievements[j]);
            achievement.earned = earned[achievement.name] ?
                                 new Date(earned[achievement.name]) :
                                 null;
            category.achievements[j] = achievement;
        }
    }
    viewmodel.categories = achievementCategories;
    viewmodel.total = total;
    viewmodel.earned = Object.keys(earned).length;
    viewmodel.earnedText = viewmodel.earned + "/" + total + " Earned";
}

AchievementsController.prototype.init = function (client) {
    this.client = client;
    this.socket = client.gameSocket;
    this.playerName = client.playerName;
    this.viewmodel = client.viewmodel;
    this.findSelfIndex = client.findSelfIndex;

    Loggers.Debug.log("about time");
    var onAchievementsLoaded = function (rawAchievements) {
        var achievements = "Object(" + rawAchievements + ")";
        achievements = eval(achievements); // jshint ignore: line
        this.client.azureManager.loadStats(function (stats) {
            var achievementsEarnedColumn = "achievements_earned";
            prepareAchievements(this.viewmodel,
                                achievements,
                                JSON.parse(stats[achievementsEarnedColumn]));

            $(document).ready(function () {
                ko.applyBindings(this.viewmodel,
                                document.querySelector(".tabs"));
                document.querySelector(".tabs input:first-of-type")
                        .checked = true;
            }.bind(this));
        }.bind(this));
    }.bind(this);

    $.ajax({
      url: "/content/achievements.json",
      success: onAchievementsLoaded,
      dataType: "text"
    }).fail(function () {
        Loggers.Debug.error("An error occurred while loading" +
                            "achievements: {0}",
                            Loggers.asJSON(arguments[2]));
    });
};

module.exports = AchievementsController;
