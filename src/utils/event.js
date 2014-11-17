var Event = function () {
    this.listeners = [];
};

Event.prototype.addEventListener = function (callback) {
    this.listeners.push(callback);
};

Event.prototype.removeEventListener = function (callback) {
    for (var i = 0; i < this.listeners.length; i++) {
        if (this.listeners[i] == callback) {
            this.listeners[i] = this.listeners[this.listeners.length - 1];
            this.listeners.pop();
        }
    }
}

Event.prototype.fire = function () {
    for (var i = 0; i < this.listeners.length; i++) {
        this.listeners[i].apply(undefined, arguments);
    }
}


if(typeof module != "undefined" && module.exports) {
    module.exports = Event;
}

