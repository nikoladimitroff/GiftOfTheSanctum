var sanctum = require("./all_sanctum") || sanctum;
sanctum = sanctum || {};

var allPhysics = require("./physics");
var physics = physics || {};
var Vector = Vector || {};

if(allPhysics) {
    physics = allPhysics.physics || physics;
    Vector = allPhysics.Vector || Vector;
}

sanctum.Sprite = function (image, framesPerRow) {
    this.image = image;
    this.framesPerRow = framesPerRow;
    var maxFrames = Math.max.apply(undefined, framesPerRow);
    this.frameWidth = image.width / maxFrames;
    this.frameHeight = image.height / framesPerRow.length;
    this.activeAnimation = 0;
    this.frameIndex = 0;
    this.lastFrameUpdate = 0;
}

sanctum.Sprite.prototype.clone = function () {
    var sprite = new sanctum.Sprite({}, []);
    for (var prop in sprite) {
        sprite[prop] = this[prop];
    }
    return sprite;
}

sanctum.Renderer = function (context) {
    this.context = context;
}

sanctum.Renderer.prototype.init = function(camera) {
    this.camera = camera;

    var onresize = function() {
        this.context.canvas.width = window.innerWidth;
        this.context.canvas.height = window.innerHeight;
        window.aspect = this.context.canvas.width / this.context.canvas.height;

        this.camera.viewport.x = this.context.canvas.width;
        this.camera.viewport.y = this.context.canvas.height;
    }.bind(this);
    onresize();
    window.onresize = onresize;
}


sanctum.Renderer.prototype.getViewportCenter = function () {
    return new Vector(this.context.canvas.width / 2,
                      this.context.canvas.height / 2);
}

sanctum.Renderer.prototype.getPlatformCenter = function (platform) {
    return new Vector(platform.width / 2,
                      platform.height / 2);
}

sanctum.Renderer.prototype.renderCircle = function (obj) {
    this.context.beginPath();
    this.context.arc(obj.position.x + obj.size.x / 2, 
                     obj.position.y + obj.size.y / 2, 
                     obj.collisionRadius,
                     0, 2 * Math.PI);
    this.context.closePath();
    this.context.stroke();
}   

sanctum.Renderer.prototype.renderOverlay = function () {
    this.context.globalAlpha = 0.5;
    this.context.fillStyle = "#222";
    this.context.fillRect(0, 0, canvas.width, canvas.height);
    this.context.globalAlpha = 1;
}

sanctum.Renderer.prototype.renderPlatform = function (platform) {
    console.log(platform.width);
    this.context.drawImage(platform.texture, 
                           0, 0, platform.texture.width, platform.texture.height,
                           0, 0,
                           platform.width, platform.height);

    this.context.drawImage(platform.outsideTexture, 
                           0, 0, 
                           platform.outsideTexture.width, platform.outsideTexture.height,
                           0, 0,
                           platform.size.x, platform.size.y
                           );
    
    this.context.save();
    this.context.beginPath();
    var canvasMid = this.getPlatformCenter(platform);
    var point = platform.vertices[0].add(canvasMid);
    this.context.moveTo(point.x, point.y);
    for (var i = 1; i < platform.vertices.length; i++) {
        point = platform.vertices[i].add(canvasMid);
        this.context.lineTo(point.x, point.y);
    }
    this.context.clip();
    this.context.closePath();
    var destination = canvasMid.clone();
    destination.x -= platform.width / 2;
    destination.y -= platform.height / 2;
    this.context.drawImage(platform.texture, 
                           destination.x * platform.texture.width / platform.width, 
                           destination.y * platform.texture.width / platform.width, 
                           platform.texture.width, platform.texture.height,
                           destination.x, destination.y,
                           platform.width, platform.height);
    this.context.restore();
}   

sanctum.Renderer.prototype.render = function (platform, gameObjects, dt) {
    var context = this.context;
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.save();
    context.translate(-this.camera.position.x, -this.camera.position.y);

    this.renderPlatform(platform);
    for (var i = 0; i < gameObjects.length; i++) {
        var obj = gameObjects[i];

        if (!obj || obj.dead) continue;
        
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
                          
        this.renderCircle(obj);
        
        context.restore();

        var msPerFrame = 1000 / sprite.framesPerRow[sprite.activeAnimation];
        sprite.lastFrameUpdate += dt;
        if (sprite.lastFrameUpdate > msPerFrame) {
            sprite.frameIndex = (sprite.frameIndex + 1) % sprite.framesPerRow[sprite.activeAnimation];
            sprite.lastFrameUpdate = 0;
        }            
    }
    context.restore();
}


if(typeof module != "undefined" && module.exports) {
    module.exports.Renderer = sanctum.Renderer;
}
