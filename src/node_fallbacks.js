/*
 * This file provides fallbacks for several functions/objects that are used all
 * around node.js
**/

var module = {
    exports: {},
};

var require = function (moduleName) {
    if (!moduleName) throw new Error("Could not load module: " + moduleName);
    return moduleName.exports || moduleName;
}