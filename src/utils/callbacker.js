"use strict";
var Callbacker = function (onsuccess, onerror, ondone) {
    var successes = 0,
        failures = 0;
    this.attempts = 0;

    var self = this;
    var done = function () {
        if (successes + failures == self.attempts) {
            if (ondone)
                ondone(successes, failures, self.attempts);
        }
    };
    var error = function (e) {
        failures++;
        if (onerror)
            onerror(e);
        done();
    };
    var success = function () {
        successes++;
        if (onsuccess)
            onsuccess();
        done();
    };

    this.success = success;
    this.error = error;
};

module.exports = Callbacker;
