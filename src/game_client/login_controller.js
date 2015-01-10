"use strict";

var LoginController = function () {
    this.client = null;
};

LoginController.prototype.init = function (client) {
    this.client = client;

    $("#playButton").on("click", function () {
        var name = $("#name").val();
        this.client.doNormalLogin(name);
    }.bind(this));

    $("#azureButton").on("click", function () {
        this.client.doAzureLogin();
    }.bind(this));

    $("#name").keydown(function (event) {
        if (event.keyCode == 13 /*Enter*/) {
            var name = $("#name").val();
            this.client.doNormalLogin(name);
        }
    }.bind(this));
};

module.exports = LoginController;
// global.LoginController = LoginController;
