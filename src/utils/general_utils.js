"use strict";

function UTCDate() {
    var now = new Date();
    var nowUtc = new Date(now.getUTCFullYear(), now.getUTCMonth(),
                          now.getUTCDate(), now.getUTCHours(),
                          now.getUTCMinutes(), now.getUTCSeconds(),
                          now.getUTCMilliseconds());
    return nowUtc;
}

function UTCnow() {
    return UTCDate().valueOf(); // jshint ignore: line
}

module.exports.nowUTC = UTCnow;
module.exports.dateUTC = UTCDate;
