"use strict";
var SanctumEvent = function () {
    this.listeners = [];
};

SanctumEvent.prototype.addEventListener = function (callback) {
    this.listeners.push(callback);
};

SanctumEvent.prototype.removeEventListener = function (callback) {
    for (var i = 0; i < this.listeners.length; i++) {
        if (this.listeners[i] == callback) {
            this.listeners[i] = this.listeners[this.listeners.length - 1];
            this.listeners.pop();
        }
    }
};

SanctumEvent.prototype.removeAllListeners = function () {
    this.listeners = [];
};

SanctumEvent.prototype.fire = function () {
    for (var i = 0; i < this.listeners.length; i++) {
        this.listeners[i].apply(undefined, arguments);
    }
};

module.exports = SanctumEvent;
