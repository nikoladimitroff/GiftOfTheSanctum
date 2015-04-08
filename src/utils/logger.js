"use strict";
var fs = require("fs");
var path = require("path");
var StringUtils = require("./string_utils");
var dateUTC = require("./general_utils").dateUTC;

var LOG_MESSAGE_CLASS = "log-message";
var WARN_MESSAGE_CLASS = "warn-message";
var ERROR_MESSAGE_CLASS = "error-message";

var FADE_OUT_MILLISECONDS = 3000;
var MAXIMUM_NUMBER_OF_MESSAGES = 5;

function getTimestamp (includeDate) {
    if (includeDate === undefined)
        includeDate = true;

    var now = dateUTC();
    if (includeDate) {
        return StringUtils.format("[{0}.{1}.{2} {3}:{4}:{5}]",
                                  StringUtils.padLeft(now.getDate(), "00"),
                                  StringUtils.padLeft(now.getMonth(), "00"),
                                  StringUtils.padLeft(now.getFullYear(),
                                                      "0000"),
                                  StringUtils.padLeft(now.getHours(), "00"),
                                  StringUtils.padLeft(now.getMinutes(), "00"),
                                  StringUtils.padLeft(now.getSeconds(), "00"));
    }
    else {
        return StringUtils.format("[{0}:{1}:{2}]",
                                  StringUtils.padLeft(now.getHours(), "00"),
                                  StringUtils.padLeft(now.getMinutes(), "00"),
                                  StringUtils.padLeft(now.getSeconds(), "00"));
    }
}

function getLogFilename () {
    // jscs: disable
    return dateUTC().toString().replace(/:/g, "-");
    // jscs: enable
}

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

GameplayLogger.prototype.log = function (message /*,  args */) {
    message = StringUtils.format.apply(undefined, arguments);
    this.genericLog(message, LOG_MESSAGE_CLASS);
};

GameplayLogger.prototype.warn = function (message /*,  args */) {
    message = StringUtils.format.apply(undefined, arguments);
    this.genericLog(message, WARN_MESSAGE_CLASS);
};

GameplayLogger.prototype.error = function (message /*,  args */) {
    message = StringUtils.format.apply(undefined, arguments);
    this.genericLog(message, ERROR_MESSAGE_CLASS);
};

var LogTypes = {
    Log: "Log",
    Warning: "Warning",
    Error: "Error"
};

var FileLogger = function (logFolderPath) {
    this.logFile = path.join(logFolderPath, getLogFilename() + ".log");
    // Create the file if it doesn't exist
    if (!fs.existsSync(logFolderPath)) {
        fs.mkdirSync(logFolderPath);
    }
    fs.closeSync(fs.openSync(this.logFile, "a"));
};

FileLogger.prototype.genericLog = function (message, type) {
    var formattedMessage = StringUtils.format("[{0}]{1} {2}\r\n",
                                              type,
                                              getTimestamp(),
                                              message);
    fs.appendFileSync(this.logFile, formattedMessage);
};

FileLogger.prototype.log = function (message /*,  args */) {
    message = StringUtils.format.apply(undefined, arguments);
    this.genericLog(message, LogTypes.Log);
};

FileLogger.prototype.warn = function (message /*,  args */) {
    message = StringUtils.format.apply(undefined, arguments);
    this.genericLog(message, LogTypes.Warning);
};

FileLogger.prototype.error = function (message /*,  args */) {
    message = StringUtils.format.apply(undefined, arguments);
    this.genericLog(message, LogTypes.Error);
};

var ConsoleLogger = function () {};
ConsoleLogger.prototype.log = function (message /*,  args */) {
    message = getTimestamp(false) + " " +
              StringUtils.format.apply(undefined, arguments);
    console.log(message);
};

ConsoleLogger.prototype.warn = function (message /*,  args */) {
    message = getTimestamp(false) + " " +
              StringUtils.format.apply(undefined, arguments);
    console.warn(message);
};

ConsoleLogger.prototype.error = function (message /*, args */) {
    message = getTimestamp(false) + " " +
              StringUtils.format.apply(undefined, arguments);
    console.error(message);
};

var MultipleLogger = function (loggers) {
    this.loggers = loggers;
};

MultipleLogger.prototype.log = function (message /*, args */) {
    message = StringUtils.format.apply(undefined, arguments);
    for (var i = 0; i < this.loggers.length; i++) {
        this.loggers[i].log(message);
    }
};

MultipleLogger.prototype.warn = function (message /*, args */) {
    message = StringUtils.format.apply(undefined, arguments);
    for (var i = 0; i < this.loggers.length; i++) {
        this.loggers[i].warn(message);
    }
};

MultipleLogger.prototype.error = function (message /*, args */) {
    message = StringUtils.format.apply(undefined, arguments);
    for (var i = 0; i < this.loggers.length; i++) {
        this.loggers[i].error(message);
    }
};

var logFolder = path.join("..", "..", "logs");
var isBrowser = Boolean(process.browser);
var Loggers = {
    Gameplay: new GameplayLogger(),
    Debug: isBrowser ?
           new ConsoleLogger() :
           new MultipleLogger([
               new ConsoleLogger(),
               new FileLogger(path.join(__dirname, logFolder))
           ]),
};

Loggers.asJSON = function (object) {
    return JSON.stringify(object)
           .replace(/\{/g, "{{")
           .replace(/\}/g, "}}");
};

// TODO: If it is on client stub FileLogger

// Loggers.MultipleLogger = new MultipleLogger([
//     Loggers.GameplayLogger,
//     stub(Loggers.Debug),
// ]);

module.exports = Loggers;
