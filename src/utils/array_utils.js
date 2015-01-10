"use strict";

function first(array, predicate) {
    for (var i = 0; i < array.length; i++) {
        if (predicate(array[i])) {
            return array[i];
        }
    }
    return null;
}

function firstIndex(array, predicate) {
    for (var i = 0; i < array.length; i++) {
        if (predicate(array[i])) {
            return i;
        }
    }
    return null;
}

function count(array, predicate) {
    var counter = 0;
    for (var i = 0; i < array.length; i++) {
        if (predicate(array[i]))
            counter++;
    }
    return counter;
}

module.exports.first = first;
module.exports.firstIndex = firstIndex;
module.exports.count = count;
