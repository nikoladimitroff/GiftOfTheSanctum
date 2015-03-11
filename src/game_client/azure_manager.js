"use strict";
var Loggers = require("../utils/logger.js");
/* global WindowsAzure */

var AzureManager = function AzureManager() {
    var url = "https://gift-of-the-sanctum.azure-mobile.net/",
        key = "sEKFgdNxpYZpJSTOfUYaxOntbHmJDY70";
    this.client = new WindowsAzure.MobileServiceClient(url, key);
    this.users = this.client.getTable("users");
};

Object.defineProperty(AzureManager.prototype, "loggedIn", {
    get: function () {
        return this.client.currentUser !== null;
    },
    enumerable: true,
    configurable: true
});

AzureManager.prototype.login = function (callback) {
    var onsuccess = this.loadInformation.bind(this, callback);
    this.client.login("microsoftaccount").done(onsuccess, function (error) {
        Loggers.Debug.log("An error occurred while login: {0}", error);
    });
};

AzureManager.prototype.lookup = function (tableName, onsuccess, onerror) {
    var table = this.client.getTable(tableName);
    table.lookup(this.client.currentUser.userId)
    .done(function (result) {
        Loggers.Debug.log("Azure success: ", result);
        if (onsuccess) onsuccess(result);
    }, function (error) {
        Loggers.Debug.error("Azure error: ", error);
        if (onerror) onerror(error);
    });
};

AzureManager.prototype.loadInformation = function (updateCallback) {
    var onerror = function () {
        this.users.insert({id: this.client.currentUser.userId})
        .done(this.lookup.bind(this, "users", updateCallback));
    }.bind(this);
    var onsuccess = updateCallback;
    this.lookup("users", onsuccess, onerror);
};

AzureManager.prototype.loadStats = function (updateCallback) {
    var onerror = function () {
        var message = "Could not load stats at the moment. " +
                      "Please try again later.";
        Loggers.Gameplay.error(message);
    }.bind(this);
    var onsuccess = updateCallback;
    this.lookup("user_statistics", onsuccess, onerror);
};

AzureManager.prototype.save = function (info) {
    if (this.loggedIn) {
        info = JSON.parse(JSON.stringify(info)); // Deep copy
        info.id = this.client.currentUser.userId;
        this.users.update(info);
    }
};

module.exports = AzureManager;
