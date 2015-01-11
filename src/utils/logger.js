"use strict";

var LOG_MESSAGE_CLASS = "log-message";
var WARN_MESSAGE_CLASS = "warn-message";
var ERROR_MESSAGE_CLASS = "error-message";

var GameplayLogger = function (events) {
    this.events = events;
};

GameplayLogger.prototype.log = function (message) {
    this.events.logGameplayMessage.fire(message, LOG_MESSAGE_CLASS);
};

GameplayLogger.prototype.warn = function (message) {
    this.events.logGameplayMessage.fire(message, WARN_MESSAGE_CLASS);
};

GameplayLogger.prototype.error = function (message) {
    this.events.logGameplayMessage.fire(message, ERROR_MESSAGE_CLASS);
};

module.exports.GameplayLogger = GameplayLogger;
