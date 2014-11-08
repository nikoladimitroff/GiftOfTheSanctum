var sanctum = sanctum || {};

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

sanctum.Renderer.prototype.getViewportCenter = function () {
    return new Vector(this.context.canvas.width / 2,
                      this.context.canvas.height / 2);
}

sanctum.Renderer.prototype.renderCircle = function (obj) {
    this.context.beginPath();
    this.context.arc(obj.position.x + obj.scale * obj.sprite.frameWidth / 2, 
                     obj.position.y + obj.scale * obj.sprite.frameHeight / 2, 
                     obj.collisionRadius,
                     0, 2 * Math.PI);
    this.context.closePath();
    this.context.stroke();
}   


sanctum.Renderer.prototype.renderPlatform = function (platform) {
    this.context.drawImage(platform.outsideTexture, 
                           0, 0, 
                           platform.outsideTexture.width, platform.outsideTexture.height,
                           0, 0,
                           this.context.canvas.width, this.context.canvas.height
                           );

    this.context.save();
    this.context.beginPath();
    var canvasMid = this.getViewportCenter();
    var point = platform.vertices[0].add(canvasMid);
    this.context.moveTo(point.x, point.y);
    for (var i = 1; i < platform.vertices.length; i++) {
        point = platform.vertices[i].add(canvasMid);
        this.context.lineTo(point.x, point.y);
    }
    this.context.clip();
    this.context.closePath();
    var destination = canvasMid.clone();
    destination.x -= platform.texture.width / 2;
    destination.y -= platform.texture.height / 2;
    this.context.drawImage(platform.texture, 
                           0, 0, platform.texture.width, platform.texture.height,
                           destination.x, destination.y,
                           platform.texture.width, platform.texture.height);
    this.context.restore();
}   

sanctum.Renderer.prototype.render = function (platform, gameObjects, dt) {
    var context = this.context;
    context.clearRect(0, 0, canvas.width, canvas.height);
    this.renderPlatform(platform);
    for (var i = 0; i < gameObjects.length; i++) {
        var obj = gameObjects[i];
        var scale = obj.scale;
        var sprite = obj.sprite;
        var frameX = sprite.frameIndex * sprite.frameWidth;
        var frameY = sprite.activeAnimation * sprite.frameHeight;
        
        context.save();
        var cx = obj.position.x + scale * sprite.frameWidth / 2;
        var cy = obj.position.y + scale * sprite.frameHeight / 2;
        context.translate(cx, cy);
        context.rotate(obj.rotation);
        context.translate(-cx, -cy);
        
        context.drawImage(sprite.image, 
                          frameX, frameY,
                          sprite.frameWidth, 
                          sprite.frameHeight,
                          obj.position.x,
                          obj.position.y,
                          scale * sprite.frameWidth, 
                          scale * sprite.frameHeight
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
}