"use strict";
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
        return console.log(error);
    });
};

AzureManager.prototype.lookup = function (onsuccess, onerror) {
    this.users.lookup(this.client.currentUser.userId)
    .done(function (result) {
        console.log("Azure success: ", result);
        if (onsuccess) onsuccess(result);
    }, function (error) {
        console.error("Azure error: ", error);
        if (onerror) onerror(error);
    });
};

AzureManager.prototype.loadInformation = function (updateCallback) {
    var onerror = function () {
        this.users.insert({id: this.client.currentUser.userId})
        .done(this.lookup.bind(this, updateCallback));
    }.bind(this);
    var onsuccess = updateCallback;
    this.lookup(onsuccess, onerror);
};

AzureManager.prototype.save = function (info) {
    if (this.loggedIn) {
        info = JSON.parse(JSON.stringify(info)); // Deep copy
        info.id = this.client.currentUser.userId;
        this.users.update(info);
    }
};

module.exports = AzureManager;
