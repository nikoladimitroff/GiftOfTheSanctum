var sanctum = sanctum || {};

sanctum.ContentManager = function () {
    this.contentCache = {};
    this.loading = 0;
    this.loaded = 0;
    this.onload = function () {};
}

sanctum.ContentManager.prototype.loadSprite = function (description) {
    var image = new Image();
    var path = description.src;
    var framesPerRow = description.framesPerRow;
    image.onload = function () {
        this.contentCache[path] = new sanctum.Sprite(image, framesPerRow);
        this.loaded++;
        if (this.loaded == this.loading) {
            this.onload();
        }
    }.bind(this);
    image.src = path;
    this.loading++;
};


sanctum.ContentManager.prototype.get = function (path) {
    return this.contentCache[path];
};