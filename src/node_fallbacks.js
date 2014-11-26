"use strict";
/*
 * This file provides fallbacks for several functions/objects that are used all
 * around node.js
**/

// var module = {
//     exports: {},
// };

var require = function (moduleName) {
    return null;

    if (!moduleName) throw new Error("Could not load module: " + moduleName);
    return moduleName.exports || moduleName;
}

window = window || {};
// window.requestAnimationFrame = (function(){
//   return  window.requestAnimationFrame       ||
//           window.webkitRequestAnimationFrame ||
//           window.mozRequestAnimationFrame    ||
//           function(callback){
//             window.setTimeout(callback, 1000 / 60);
//           };
// })();
