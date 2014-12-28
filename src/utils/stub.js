"use strict";
var stub = function (cls) {
    var fakeClass = function () {};
    for (var i in cls.prototype) {
        if (typeof cls.prototype[i] === "function") {
            fakeClass.prototype[i] = function () {};
        }
        else {
            fakeClass.prototype[i] = cls.prototype[i];
        }
    }
    return fakeClass;
};

module.exports = stub;
