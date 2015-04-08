"use strict";
// jshint ignore: start
var LoginController = require("../game_client/login_controller.js");
var GameController = require("../game_client/game_controller.js");
var PleaseWaitController = require("../game_client/please_wait_controller.js");
var RoomController = require("../game_client/room_controller");
var AchievementsController = require("../game_client/achievements_controller");
// jshint ignore: end

var CONTROLLER_SUFFIX = "Controller";

var UIHelper = function () {};

UIHelper.prototype.loadView = function (view, container, client) {
    container = (container) ? container : "main#content";
    var content = $(container);
    $(content).html($("#" + view).html());
    $(content).removeClass();
    $(content).addClass(view);

    var typeName = view.split("_").map(function (s) {
        return s[0].toUpperCase() + s.substr(1);
    }).join("") + CONTROLLER_SUFFIX;

    var Type = eval(typeName); // jshint ignore: line
    if (Type) {
        var controller = new Type();
        controller.init(client);
    } else {
        throw new Error("No such controller!");
    }
};

module.exports = UIHelper;

