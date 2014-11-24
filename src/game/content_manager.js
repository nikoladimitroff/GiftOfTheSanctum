"use strict";

var Platform = require("./platform");

var allGameObjects = require("./game_objects");
var Character = allGameObjects.Character,
    Spell = allGameObjects.Spell;

var Vector = require("./math/vector");

var fs = require("fs");


function getFilename(path) {
    return path.substring(path.lastIndexOf("/") + 1)
}

function getFilenameWithoutExtension(path) {
    var filename = getFilename(path);
    return filename.substring(0, filename.lastIndexOf("."));
}

var ContentManager = function () {
    this.contentCache = {};
    this.loading = 0;
    this.loaded = 0;
    this.onload = function () {};
    this.root = "content/"
}

ContentManager.prototype.loadSprite = function (description) {
    var path = this.root + description.src;
    if (this.contentCache[path])
        return this.contentCache[path];

    var image = new Image();
    var framesPerRow = description.framesPerRow;
    image.onload = function () {
        this.contentCache[path] = new Sprite(image, framesPerRow);
        this.loaded++;
        if (this.loaded == this.loading) {
            this.onload();
        }
    }.bind(this);
    image.src = path;
    this.loading++;
};

ContentManager.prototype.loadSpell = function (description) {
    var sprite = this.get(description.sprite);
    this.contentCache[description.name] = new Spell(sprite, description);
};

ContentManager.prototype.loadObstacle = function (description) {
    var sprite = this.get(description.sprite);
    this.contentCache[description.name] = new Obstacle(sprite, description);
};

ContentManager.prototype.loadCharacter = function (description) {
    var url = description.sprite;
    var sprite = this.get(this.root + url);
    var character = new Character(sprite, description);
    var name = "character_" + getFilenameWithoutExtension(url);
    console.log(name);
    this.contentCache[name] = character;
};

ContentManager.prototype.loadPlatform = function (description, isServer) {
    var platform;
    if(isServer) {
        platform = new Platform({}, {}, description);
    } else {
        var platform = new Platform(this.get(description.texture).image,
                                            this.get(description.outsideTexture).image,
                                            description
                                            );
    }

    this.contentCache[description.name] = platform;
};


ContentManager.prototype.loadKeybindings = function (keybindings) {
    this.contentCache["keybindings"] = keybindings;
};

ContentManager.prototype.fetchJSONFile = function (path, callback) {
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

ContentManager.prototype.loadGameData = function (gameDataPath, callback, isServer) {
    if(isServer) {
        this.loadGameDataServer(gameDataPath, callback);
        return;
    }

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

                        self.fetchJSONFile(gameData.obstacles, function(obstacles) {
                            obstacles.map(self.loadObstacle.bind(self));
                            callback();
                        })
                    });
                });
            }
            sprites.map(self.loadSprite.bind(self));
        });
    });
}

ContentManager.prototype.loadGameDataServer = function (gameDataPath, callback) {
    var self = this;

    var gameData = this.fetchJSONServer(gameDataPath);
    gameData.characters.map(self.loadCharacter.bind(self));

    var spellLibrary = this.fetchJSONServer(gameData.spells);

    spellLibrary.map(self.loadSpell.bind(self));

    var platform = this.fetchJSONServer(gameData.platform);

    self.loadPlatform(platform, true);
    callback();
}

ContentManager.prototype.fetchJSONServer = function(path) {
    var stringData = fs.readFileSync(this.root + path, "utf8");
    var data = eval("Object(" + stringData + ")");

    return data;
}


ContentManager.prototype.get = function (path) {
    return this.contentCache[path];
};

ContentManager.prototype.getSpellLibrary = function () {
    var spellLib = {};
    for (var path in this.contentCache) {
        var content = this.contentCache[path];
        if (content instanceof Spell) {
            spellLib[content.name] = content;
        }
    }
    return spellLib;
};

ContentManager.prototype.getLibrary = function(type) {
    var lib = {};
    for(var path in this.contentCache) {
        var content = this.contentCache[path];
        if(content instanceof type) {
            lib[content.name] = content;
        }
    }

    return lib;
}

module.exports = ContentManager;