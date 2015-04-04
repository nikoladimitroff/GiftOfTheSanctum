"use strict";
var Vector = require("./math/vector");

var Renderer = function (context, debugRender, autoresize) {
    this.context = context;
    this.debugLineWidth = 4;
    this.debugVectorScale = 1;
    this.debugRender = debugRender;
    this.autoresize = autoresize;
};

Renderer.prototype.init = function (camera) {
    this.camera = camera;

    this.camera.viewport.x = this.context.canvas.width;
    this.camera.viewport.y = this.context.canvas.height;

    if (this.autoresize !== 0) {
        var onresize = function () {
            window.innerWidth = 1366; // Magic
            window.innerHeight = 768; // Magic
            this.context.canvas.width = this.autoresize * window.innerWidth;
            this.context.canvas.height = this.autoresize * window.innerHeight;

            this.camera.viewport.x = this.context.canvas.width;
            this.camera.viewport.y = this.context.canvas.height;

            // Let me have pixelzz!
            this.context.imageSmoothingEnabled = false;
        }.bind(this);
        onresize();
        window.onresize = onresize;
    }
};

Renderer.prototype._parseCoordinates = function (coords) {
    var canvas = this.context.canvas;
    if (coords.x < 0) {
        coords.x += canvas.width;
    }
    if (coords.y < 0) {
        coords.y += canvas.height;
    }
};

Renderer.prototype.getViewportCenter = function () {
    return new Vector(this.context.canvas.width / 2,
                      this.context.canvas.height / 2);
};

Renderer.prototype.getPlatformCenter = function (platform) {
    return new Vector(-this.camera.position.x + platform.width / 2,
                      -this.camera.position.y + platform.height / 2);
};

Renderer.prototype.getPlatformSourceVectors = function (platform) {
    var platformRatio = new Vector(platform.texture.width / platform.width,
                                   platform.texture.height / platform.height);

    var position = this.camera.position.multiply(platformRatio);
    if (position.x < 0)
        position.x = 0;
    if (position.y < 0)
        position.y = 0;

    var size = this.camera.viewport.multiply(platformRatio);

    if (position.x + size.x > platform.texture.width)
        size.x = Math.min(size.x - position.x, platform.texture.width);
    if (position.y + size.y > platform.texture.height)
        size.y = Math.min(size.y - position.y, platform.texture.height);

    return {
        position: position,
        size: size,
    };
};

Renderer.prototype.renderCircle = function (center, radius, color) {
    this.context.beginPath();
    this.context.arc(center.x,
                     center.y,
                     radius,
                     0, 2 * Math.PI);
    this.context.closePath();
    this.context.strokeColor = color || "black";
    this.context.stroke();
};

Renderer.prototype.renderVector = function (vector, position, color, offset) {
    var arrowHeadLength = 10;
    var fromX = position.x,
        fromY = position.y;

    if (offset !== undefined) {
        fromX += offset.x;
        fromY += offset.y;
    }
    var toX = fromX + vector.x * this.debugVectorScale,
        toY = fromY + vector.y * this.debugVectorScale;


    var angle = Math.atan2(toY - fromY, toX - fromX);

    this.context.save();
    this.context.strokeStyle = this.context.fillStyle = color;
    this.context.lineWidth = this.debugLineWidth;

    this.context.beginPath();
    this.context.moveTo(fromX, fromY);
    this.context.lineTo(toX, toY);
    this.context.stroke();

    this.context.beginPath();
    this.context.moveTo(toX, toY);
    this.context.lineTo(toX - arrowHeadLength * Math.cos(angle - Math.PI / 7),
                        toY - arrowHeadLength * Math.sin(angle - Math.PI / 7));

    this.context.lineTo(toX - arrowHeadLength * Math.cos(angle + Math.PI / 7),
                        toY - arrowHeadLength * Math.sin(angle + Math.PI / 7));

    this.context.lineTo(toX, toY);
    this.context.lineTo(toX - arrowHeadLength * Math.cos(angle - Math.PI / 7),
                        toY - arrowHeadLength * Math.sin(angle - Math.PI / 7));
    this.context.stroke();
    this.context.fill();
    this.context.restore();
};

Renderer.prototype.renderBackground = function (backgroundTexture) {
    this.context.drawImage(backgroundTexture,
                           0, 0,
                           backgroundTexture.width, backgroundTexture.height,
                           0, 0,
                           this.camera.viewport.x, this.camera.viewport.y
                           );
};

Renderer.prototype.renderOverlay = function () {
    this.context.globalAlpha = 0.5;
    this.context.fillStyle = "#222";
    this.context.fillRect(0, 0, this.camera.viewport.x, this.camera.viewport.y);
    this.context.globalAlpha = 1;
};

Renderer.prototype.renderPlatform = function (platform) {
    var vectors = this.getPlatformSourceVectors(platform);
    var sourcePosition = vectors.position;
    var sourceSize = vectors.size;

    this.context.drawImage(platform.texture,
                           sourcePosition.x, sourcePosition.y,
                           sourceSize.x, sourceSize.y,
                           0, 0,
                           this.camera.viewport.x, this.camera.viewport.y
                           );

    this.context.drawImage(platform.outsideTexture,
                           0, 0,
                           platform.outsideTexture.width,
                           platform.outsideTexture.height,
                           0, 0,
                           this.camera.viewport.x, this.camera.viewport.y
                           );

    this.context.save();
    this.context.beginPath();
    var platformMid = this.getPlatformCenter(platform);
    var point = platform.vertices[0].add(platformMid);
    this.context.moveTo(point.x, point.y);
    for (var i = 1; i < platform.vertices.length; i++) {
        point = platform.vertices[i].add(platformMid);
        this.context.lineTo(point.x, point.y);
    }
    this.context.closePath();
    this.context.clip();
    this.context.drawImage(platform.texture,
                           sourcePosition.x, sourcePosition.y,
                           sourceSize.x, sourceSize.y,
                           0, 0,
                           this.camera.viewport.x, this.camera.viewport.y
                           );
    this.context.restore();
};

Renderer.prototype.renderCollection = function (dt, gameObjects) {
    var context = this.context;

    for (var i = 0; i < gameObjects.length; i++) {
        var obj = gameObjects[i];

        var sprite = obj.sprite;
        var frameX = sprite.frameIndex * sprite.frameWidth;
        var frameY = sprite.activeAnimation * sprite.frameHeight;

        context.save();
        var center = obj.getCenter();
        context.translate(center.x, center.y);
        context.rotate(obj.rotation);
        context.translate(-center.x, -center.y);

        context.drawImage(sprite.image,
                          frameX, frameY,
                          sprite.frameWidth,
                          sprite.frameHeight,
                          obj.position.x,
                          obj.position.y,
                          obj.size.x,
                          obj.size.y
                          );

        if (this.debugRender) {
            this.renderCircle(obj.getCenter(), obj.collisionRadius);
            if (obj.totalVelocity) {
                this.renderVector(obj.totalVelocity, obj.position, "red");
                var offset = new Vector(0, obj.size.y / 3);
                this.renderVector(obj.acceleration,
                                  obj.position,
                                  "blue",
                                  offset);
            }
            if (obj.destination) {
                this.renderCircle(obj.destination, obj.collisionRadius);
            }
        }

        context.restore();

        var msPerFrame = 1000 / sprite.framesPerRow[sprite.activeAnimation];
        sprite.lastFrameUpdate += dt;
        if (sprite.lastFrameUpdate > msPerFrame) {
            var animationLength = sprite.framesPerRow[sprite.activeAnimation];
            sprite.frameIndex = (sprite.frameIndex + 1) % animationLength;
            sprite.lastFrameUpdate = 0;
        }
    }
};

Renderer.prototype.renderText = function (message, position,
                                          color, font, shouldCenter) {
    if (color === undefined) {
        color = "black";
    }
    if (font === undefined) {
        font = "16pt Segoe UI";
    }
    this._parseCoordinates(position);
    this.context.save();
    this.context.fillStyle = color;
    this.context.font = font;
    var positionX = position.x;
    if (positionX === "center") {
        positionX = this.context.canvas.width / 2;
    }
    if (shouldCenter) {
        positionX = positionX - this.context.measureText(message).width / 2;
    }

    this.context.fillText(message, positionX, position.y);
    this.context.restore();
};

Renderer.prototype.render = function (dt,
                                      objectCollections,
                                      platform,
                                      shouldRenderOverlay) {

    var context = this.context;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    if (platform) {
        if (platform instanceof HTMLImageElement) {
            this.renderBackground(platform);
        }
        else {
            this.renderPlatform(platform);
        }
    }

    context.save();
    context.translate(-this.camera.position.x, -this.camera.position.y);

    for (var i = 0; i < objectCollections.length; i++) {
        this.renderCollection(dt, objectCollections[i]);
    }

    context.restore();

    if (shouldRenderOverlay)
        this.renderOverlay();
};


module.exports = Renderer;
