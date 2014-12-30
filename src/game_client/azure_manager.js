"use strict";
/* global WindowsAzure */

var AzureManager = function AzureManager() {
    var url = "https://gift-of-the-sanctum.azure-mobile.net/",
        key = "sEKFgdNxpYZpJSTOfUYaxOntbHmJDY70";
    this.client = new WindowsAzure.MobileServiceClient(url, key);
    this.users = this.client.getTable("users");
};

Object.defineProperty(AzureManager.prototype, "loggedIn", {
    // MAKE THE LOGIN AT A DIFFERENT TIME & PLACE
    // PERHAPS A PRE-START MAIN MENU SCREEN
    // TEST IT LOADING A GAME
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

AzureManager.prototype.loadInformation = function (updateCallback) {
    var self = this;
    this.userInfo.read().done(function (result) {
        if (result && result[0]) {
            updateCallback(result[0]);
        } else {
            self.userInfo.insert({
                id: self.client.currentUser.id
            });
        }
    }, function (error) {
        console.log(error);
    });
};

AzureManager.prototype.save = function (info) {
    if (this.loggedIn) {
        info = JSON.parse(JSON.stringify(info)); // Deep copy
        info.id = this.client.currentUser.userId;
        this.users.update(info);
    }
};

module.exports = AzureManager;
