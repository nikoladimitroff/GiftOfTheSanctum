"use strict";
var fs = require("fs");

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

var FileLogger = function (logFolderPath) {
    this.logFolder = logFolderPath;
};

FileLogger.prototype.log = function (message) {
    var now = new Date().toLocaleString();
    var writeMessage = "[" + now + "] " + message + "\r\n";
    fs.appendFile(this.logFolder + "log.txt", writeMessage,
        function (err) {
            if (err) {
                console.log(err);
            }
        }
    );
};

FileLogger.prototype.warn = function (message) {
    var now = new Date().toLocaleString();
    var writeMessage = "[" + now + "] " + message + "\r\n";
    fs.appendFile(this.logFolder + "warn.txt", writeMessage,
        function (err) {
            if (err) {
                console.log(err);
            }
        }
    );
};

FileLogger.prototype.error = function (message) {
    var now = new Date().toLocaleString();
    var writeMessage = "[" + now + "] " + message + "\r\n";
    fs.appendFile(this.logFolder + "error.txt", writeMessage,
        function (err) {
            if (err) {
                console.log(err);
            }
        }
    );
};

// var Loggers = {
//     Gameplay: new GameplayLogger(),
//     Debug: new FileLogger(),
// };

// module.exports.Loggers = Loggers;
module.exports.GameplayLogger = GameplayLogger;
module.exports.FileLogger = FileLogger;
