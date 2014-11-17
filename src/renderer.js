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
    return new Vector(-this.camera.position.x + platform.width / 2, 
                      -this.camera.position.y + platform.height / 2);
}


sanctum.Renderer.prototype.getPlatformSourceVectors = function (platform) {
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
                           platform.outsideTexture.width, platform.outsideTexture.height,
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
}

sanctum.Renderer.prototype.renderCollection = function (dt, gameObjects) {
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
                          
        // this.renderCircle(obj);
        
        context.restore();

        var msPerFrame = 1000 / sprite.framesPerRow[sprite.activeAnimation];
        sprite.lastFrameUpdate += dt;
        if (sprite.lastFrameUpdate > msPerFrame) {
            sprite.frameIndex = (sprite.frameIndex + 1) % sprite.framesPerRow[sprite.activeAnimation];
            sprite.lastFrameUpdate = 0;
        }            
    }
}

sanctum.Renderer.prototype.render = function (dt, objectCollections, platform, shouldRenderOverlay) {
    var context = this.context;
    context.clearRect(0, 0, canvas.width, canvas.height);

    this.renderPlatform(platform);

    context.save();
    context.translate(-this.camera.position.x, -this.camera.position.y);
    
    for (var i = 0; i < objectCollections.length; i++) {
        this.renderCollection(dt, objectCollections[i]);
    }
    
    
    if (shouldRenderOverlay)
        this.renderOverlay();

    context.restore();
};


if(typeof module != "undefined" && module.exports) {
    module.exports.Renderer = sanctum.Renderer;
}
