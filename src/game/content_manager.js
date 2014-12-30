"use strict";
/* global AudioContext */

var Platform = require("./platform");

var allGameObjects = require("./game_objects");
var Character = allGameObjects.Character,
    Spell = allGameObjects.Spell;
var Sprite = require("./sprite");

var fs = require("fs");


function getFilename(path) {
    return path.substring(path.lastIndexOf("/") + 1);
}

function getFilenameWithoutExtension(path) {
    var filename = getFilename(path);
    return filename.substring(0, filename.lastIndexOf("."));
}

var ContentManager = function () {
    this.contentCache = {};
    this.loading = 0;
    this.loaded = 0;
    this.onResourcesLoaded = function () {};
    this.root = "content/";

    this.audioLibraryKey = "audiolib";
    this.contentCache[this.audioLibraryKey] = {};
    this.spellsSpritesPath = "content/art/spells/";
    this.spellsIconsPath = "content/art/spells/icons/";
    this.spellImageFormat = ".png";
};

ContentManager.prototype.loadSprite = function (description) {
    var path = this.root + description.src;
    if (this.contentCache[path])
        return this.contentCache[path];

    var image = new Image();
    var framesPerRow = description.framesPerRow;
    image.onload = function () {
        this.contentCache[path] = new Sprite(image, framesPerRow);
        this.loaded++;
        if (this.loaded === this.loading) {
            this.onResourcesLoaded();
        }
    }.bind(this);
    image.src = path;
    this.loading++;
};

ContentManager.prototype.loadSpell = function (description) {
    var name = description.name;
    var filename = name.toLowerCase().replace(/ /g, "_") + this.spellImageFormat;
    var sprite = this.get(this.spellsSpritesPath + filename);
    description.icon = this.spellsIconsPath + filename;
    this.contentCache[description.name] = new Spell(sprite, description);
};

ContentManager.prototype.loadAudio = function (audioInfo) {
    this.loading++;
    var path = audioInfo.src;
    this.fetchJSONFile(audioInfo.src, function (data) {
        AudioContext.instance.decodeAudioData(data, function (buffer) {
            audioInfo.buffer = buffer;
            this.contentCache[this.audioLibraryKey][path] = audioInfo;
            this.loaded++;
            if (this.loaded === this.loading) {
                this.onResourcesLoaded();
            }
        }.bind(this));
    }.bind(this), "arraybuffer");
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
    if (isServer) {
        platform = new Platform({}, {}, description);
    }
    else {
        platform = new Platform(this.get(description.texture).image,
                                this.get(description.outsideTexture).image,
                                description);
    }

    this.contentCache[description.name] = platform;
};

ContentManager.prototype.loadKeybindings = function (keybindings) {
    var keybindingsKey = "keybindings";
    this.contentCache[keybindingsKey] = keybindings;
};

ContentManager.prototype.fetchJSONFile = function (path,
                                                   callback,
                                                   responseType) {

    var xhr = new XMLHttpRequest();
    path = this.root + path;
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                if (responseType !== undefined) {
                    callback(xhr.response);
                }
                else {
                    var data = "Object(" + xhr.responseText + ")";
                    data = eval(data); // jshint ignore: line
                    callback(data);
                }
            }
            else {
                console.warn("Couldn't fetch json file");
            }
        }
    };
    if (responseType !== undefined) {
        xhr.responseType = responseType;
    }
    xhr.open("GET", path);
    xhr.send();
};

ContentManager.prototype.loadGameData = function (gameDataPath,
                                                  callback,
                                                  isServer) {

    if (isServer) {
        this.loadGameDataServer(gameDataPath, callback);
        return;
    }

    var self = this;
    this.fetchJSONFile(gameDataPath, function (gameData) {
        self.loadKeybindings(gameData.keybindings);
        self.onResourcesLoaded = function () {
            gameData.characters.map(self.loadCharacter.bind(self));
            self.fetchJSONFile(gameData.spells, function (spellLibrary) {
                spellLibrary.map(self.loadSpell.bind(self));

                self.fetchJSONFile(gameData.platform, function (platform) {
                    self.loadPlatform(platform);
                    callback();
                });
            });
        };
        self.fetchJSONFile(gameData.sprites, function (sprites) {
            sprites.map(self.loadSprite.bind(self));
        });
        self.fetchJSONFile(gameData.sounds, function (sounds) {
            sounds.map(self.loadAudio.bind(self));
        });
    });
};

ContentManager.prototype.loadGameDataServer = function (gameDataPath,
                                                        callback) {

    var gameData = this.fetchJSONServer(gameDataPath);
    gameData.characters.map(this.loadCharacter.bind(this));

    var spellLibrary = this.fetchJSONServer(gameData.spells);

    spellLibrary.map(this.loadSpell.bind(this));

    var platform = this.fetchJSONServer(gameData.platform);

    this.loadPlatform(platform, true);
    callback();
};

ContentManager.prototype.fetchJSONServer = function (path) {
    var stringData = fs.readFileSync(this.root + path, "utf8");
    var data = "Object(" + stringData + ")";
    data = eval(data); // jshint ignore: line

    return data;
};


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

ContentManager.prototype.getLibrary = function (type) {
    var lib = {};
    for (var path in this.contentCache) {
        var content = this.contentCache[path];
        if (content instanceof type) {
            lib[content.name] = content;
        }
    }

    return lib;
};

module.exports = ContentManager;
