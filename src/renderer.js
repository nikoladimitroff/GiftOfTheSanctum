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

sanctum.Renderer.prototype.render = function (gameObjectsCollections, dt) {
    var context = this.context;
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (var collection = 0; collection < gameObjectsCollections.length; collection++) {
        var gameObjects = gameObjectsCollections[collection];
        for (var i = 0; i < gameObjects.length; i++) {
            var obj = gameObjects[i];
            var sprite = obj.sprite;
            var frameX = sprite.frameIndex * sprite.frameWidth;
            var frameY = sprite.activeAnimation * sprite.frameHeight;
            context.drawImage(sprite.image, 
                              frameX, frameY,
                              sprite.frameWidth, 
                              sprite.frameHeight,
                              obj.position.x,
                              obj.position.y,
                              sprite.frameWidth, 
                              sprite.frameHeight
                              );

            var msPerFrame = 1000 / sprite.framesPerRow[sprite.activeAnimation];
            sprite.lastFrameUpdate += dt;
            if (sprite.lastFrameUpdate > msPerFrame) {
                sprite.frameIndex = (sprite.frameIndex + 1) % sprite.framesPerRow[sprite.activeAnimation];
                sprite.lastFrameUpdate = 0;
            }            
        }
    }
}