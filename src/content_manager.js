var sanctum = sanctum || {};

function getFilename(path) {
    return path.substring(path.lastIndexOf("/") + 1)
}

function getFilenameWithoutExtension(path) {
    var filename = getFilename(path);
    return filename.substring(0, filename.lastIndexOf("."));
}

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
    var sprite = this.get(description.sprite);
    this.contentCache[description.name] = new sanctum.Spell(sprite, description);
};

sanctum.ContentManager.prototype.loadCharacter = function (description) {
    var url = description.sprite;
    var sprite = this.get(this.root + url);
    var character = new sanctum.Character(sprite, description);
    var name = "character_" + getFilenameWithoutExtension(url);
    console.log(name);
    this.contentCache[name] = character;
};

sanctum.ContentManager.prototype.loadPlatform = function (description) {
    var platform = new sanctum.Platform(this.get(description.texture).image,
                                        this.get(description.outsideTexture).image,
                                        description
                                        );
    this.contentCache[description.name] = platform;
};


sanctum.ContentManager.prototype.loadKeybindings = function (keybindings) {
    this.contentCache["keybindings"] = keybindings;
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

sanctum.ContentManager.prototype.loadGameData = function (gameDataPath, callback) {
    var self = this;
    this.fetchJSONFile(gameDataPath, function (gameData) {    
        self.fetchJSONFile(gameData.sprites, function (sprites) {
            self.onload = function () {
                this.loadKeybindings(gameData.keybindings);
                gameData.characters.map(self.loadCharacter.bind(self));                
                self.fetchJSONFile(gameData.spells, function (spellLibrary) {
                    spellLibrary.map(self.loadSpell.bind(self));

                    self.fetchJSONFile(gameData.platform, function (platform) {
                        self.loadPlatform(platform);
                        callback();
                    });
                });
            }
            sprites.map(self.loadSprite.bind(self));
        });
    });
}


sanctum.ContentManager.prototype.get = function (path) {
    return this.contentCache[path];
};

sanctum.ContentManager.prototype.getSpellLibrary = function () {
    var spellLib = {};
    for (var path in this.contentCache) {
        var content = this.contentCache[path];
        if (content instanceof sanctum.Spell) {
            spellLib[content.name] = content;
        }
    }
    return spellLib;
};

if(typeof module != "undefined" && module.exports) {
    module.exports = sanctum.ContentManager;
}
