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

sanctum.Renderer = function (context) {
    this.context = context;
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

sanctum.Renderer.prototype.render = function (gameObjects, dt) {
    var context = this.context;
    context.clearRect(0, 0, canvas.width, canvas.height);
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