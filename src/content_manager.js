var sanctum = sanctum || {};

sanctum.ContentManager = function () {
    this.contentCache = {};
    this.loading = 0;
    this.loaded = 0;
    this.onload = function () {};
    this.root = "content/"
}

sanctum.ContentManager.prototype.loadSprite = function (description) {
    var path = this.root + description.src;
    if (this.contentCache[path])
        return this.contentCache[path];

    var image = new Image();
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

sanctum.ContentManager.prototype.loadSpell = function (description) {
    console.log("loaded spell", description);
};

sanctum.ContentManager.prototype.loadCharacter = function (description) {
    var url = description.sprite;
    var sprite = this.get(this.root + url);
    var character = new sanctum.Character(sprite, description.animations);
    var name = "character_" + url.substring(url.lastIndexOf("/") + 1)
    name = name.substring(0, name.lastIndexOf("."));
    console.log(name);
    this.contentCache[name] = character;
};

sanctum.ContentManager.prototype.fetchJSONFile = function (path, callback) {
    var xhr = new XMLHttpRequest();
    path = this.root + path;
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var data = eval("Object(" + xhr.responseText +")");
                callback(data);
            }
            else {
                console.warn("Couldn't fetch json file");
            }
        }
    };
    xhr.open('GET', path);
    xhr.send(); 
}

sanctum.ContentManager.prototype.loadAssets = function (assetsPath, callback) {
    var self = this;
    this.fetchJSONFile(assetsPath, function (assets) {    
        self.fetchJSONFile(assets.sprites, function (sprites) {
            self.onload = function () {
                assets.characters.map(self.loadCharacter.bind(self));                
                self.fetchJSONFile(assets.spells, function (spellLibrary) {
                    spellLibrary.map(self.loadSpell.bind(self));
                });
                callback();
            }
            sprites.map(self.loadSprite.bind(self));
        });
    });
}


sanctum.ContentManager.prototype.get = function (path) {
    return this.contentCache[path];
};