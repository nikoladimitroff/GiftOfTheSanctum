"use strict";

function UTCnow() {
    var now = new Date();
    var nowUtc = new Date(now.getUTCFullYear(), now.getUTCMonth(),
                          now.getUTCDate(), now.getUTCHours(),
                          now.getUTCMinutes(), now.getUTCSeconds());
    return nowUtc;
}

module.exports.utcNow = UTCnow;
