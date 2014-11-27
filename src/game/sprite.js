"use strict";

var Sprite = function (image, framesPerRow) {
    this.image = image;
    this.framesPerRow = framesPerRow;
    var maxFrames = Math.max.apply(undefined, framesPerRow);
    this.frameWidth = image.width / maxFrames;
    this.frameHeight = image.height / framesPerRow.length;
    this.activeAnimation = 0;
    this.frameIndex = 0;
    this.lastFrameUpdate = 0;
};

Sprite.prototype.clone = function () {
    var sprite = new Sprite({}, []);
    for (var prop in sprite) {
        sprite[prop] = this[prop];
    }
    return sprite;
};

module.exports = Sprite;
