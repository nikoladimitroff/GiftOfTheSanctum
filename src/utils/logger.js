"use strict";
var fs = require("fs");
var path = require("path");

var LOG_MESSAGE_CLASS = "log-message";
var WARN_MESSAGE_CLASS = "warn-message";
var ERROR_MESSAGE_CLASS = "error-message";

var FADE_OUT_MILLISECONDS = 3000;
var MAXIMUM_NUMBER_OF_MESSAGES = 5;

var LogMessage = function () {
    this.message = "";
    this.style = "";
};

var GameplayLogger = function () {
    this.pushMessageIndex = 0;
    this.messages = [
        new LogMessage(),
        new LogMessage(),
        new LogMessage(),
        new LogMessage(),
        new LogMessage(),
    ];
};

GameplayLogger.prototype.MAXIMUM_NUMBER_OF_MESSAGES = 5;

GameplayLogger.prototype.genericLog = function (message, styleClass) {
    if (this.messages[this.pushMessageIndex].message.length === 0) {
        this.messages[this.pushMessageIndex].message = message;
        this.messages[this.pushMessageIndex].style = styleClass;
        var i = this.pushMessageIndex;
        setTimeout(function () {
                this.messages[i].message = "";
            }.bind(this), FADE_OUT_MILLISECONDS);
        this.pushMessageIndex++;
        if (this.pushMessageIndex >= MAXIMUM_NUMBER_OF_MESSAGES) {
            this.pushMessageIndex = 0;
        }
    }
};

GameplayLogger.prototype.log = function (message) {
    this.genericLog(message, LOG_MESSAGE_CLASS);
};

GameplayLogger.prototype.warn = function (message) {
    this.genericLog(message, WARN_MESSAGE_CLASS);
};

GameplayLogger.prototype.error = function (message) {
    this.genericLog(message, ERROR_MESSAGE_CLASS);
};

var FileLogger = function (logFolderPath) {
    this.logFolder = logFolderPath;
};

FileLogger.prototype.genericLog = function (message, file) {
    var now = new Date().toLocaleString();
    var writeMessage = "[" + now + "] " + message + "\r\n";
    fs.appendFileSync(this.logFolder + file, writeMessage);
};

FileLogger.prototype.log = function (message) {
    this.genericLog(message, "log.txt");
};

FileLogger.prototype.warn = function (message) {
    this.genericLog(message, "warn.txt");
};

FileLogger.prototype.error = function (message) {
    this.genericLog(message, "error.txt");
};

var GenericLogger = function (loggers) {
    this.loggers = loggers;
};

GenericLogger.prototype.log = function (message) {
    for (var i = 0; i < this.loggers.length; i++) {
        this.loggers[i].log(message);
    }
};

GenericLogger.prototype.warn = function (message) {
    for (var i = 0; i < this.loggers.length; i++) {
        this.loggers[i].warn(message);
    }
};

GenericLogger.prototype.error = function (message) {
    for (var i = 0; i < this.loggers.length; i++) {
        this.loggers[i].error(message);
    }
};

var logFolder = ["..", "..", "logs"];
logFolder = logFolder.join(path.sep) + path.sep;

var Loggers = {
    GameplayLogger: new GameplayLogger(),
    DebugLogger: new FileLogger(__dirname + path.sep + logFolder),
};

// TODO: If it is on client stub FileLogger

// Loggers.GenericLogger = new GenericLogger([
//     Loggers.GameplayLogger,
//     stub(Loggers.DebugLogger),
// ]);

module.exports = Loggers;
