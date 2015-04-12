"use strict";
/* global AudioContext */

var fs = require("fs");
var Q = require("q");

var Platform = require("./platform");
var allGameObjects = require("./game_objects");
var Character = allGameObjects.Character,
    Spell = allGameObjects.Spell,
    Achievement = allGameObjects.Achievement,
    GameObjectSettings = allGameObjects.Settings;
var Sprite = require("./sprite");
var SanctumEvent = require("../utils/sanctum_event.js");
var Loggers = require("../utils/logger");

function getFilename(path) {
    return path.substring(path.lastIndexOf("/") + 1);
}

function getFilenameWithoutExtension(path) {
    var filename = getFilename(path);
    return filename.substring(0, filename.lastIndexOf("."));
}

var ContentManager = function () {
    this.contentCache = {};
    this._loading = 0;
    this._loaded = 0;
    this.root = "content/";

    this.audioLibraryKey = "audiolib";
    this.achievementsKey = "achievementlib";
    this.contentCache[this.audioLibraryKey] = {};
    this.spellsSpritesPath = this.root + "art/spells/";
    this.events = {
        charactersLoaded: new SanctumEvent(),
        loadingProgress: new SanctumEvent()
    };
    this._loadingDeferred = null;
};


ContentManager.prototype._notifyLoadingProgress = function () {
    if (this._loadingDeferred !== null) {
        this._loaded++;
        this._loadingDeferred.notify(this._loaded / this._loading);
    }
};

ContentManager.prototype.loadSprite = function (description) {
    var deferred = Q.defer();
    var imageSource = description.src || description;
    var framesPerRow = description.framesPerRow || [1];

    var path = this.root + imageSource;
    var image = new Image();
    image.onload = function () {
        this.contentCache[path] = new Sprite(image, framesPerRow);
        this._notifyLoadingProgress();
        deferred.resolve();
    }.bind(this);
    image.src = path;

    return deferred.promise;
};

ContentManager.prototype.loadAudio = function (audioInfo) {
    var deferred = Q.defer();
    var path = audioInfo.src;
    this.fetchJSONFile(audioInfo.src, "arraybuffer")
    .done(function (data) {
        AudioContext.instance.decodeAudioData(data, function (buffer) {
            if (audioInfo.volume === undefined)
                audioInfo.volume = 1;
            audioInfo.buffer = buffer;
            this.contentCache[this.audioLibraryKey][path] = audioInfo;
            this._notifyLoadingProgress();
            deferred.resolve();
        }.bind(this));
    }.bind(this));

    return deferred.promise;
};

ContentManager.prototype.loadSpell = function (description) {
    var name = description.name;
    var filename = name.toLowerCase().replace(/ /g, "_") +
                   GameObjectSettings.imageFormat;
    var sprite = this.get(this.spellsSpritesPath + filename);
    this.contentCache[description.name] = new Spell(sprite, description);
    this._notifyLoadingProgress();
};

ContentManager.prototype.loadAchievementCategory = function (category) {
    for (var i = 0; i < category.achievements.length; i++) {
        var current = category.achievements[i];
        current.category = category.name;
        this.contentCache[current.name] = new Achievement(current);
    }
    this._notifyLoadingProgress();
};

ContentManager.prototype.loadCharacter = function (description) {
    var url = description.sprite;
    var sprite = this.get(this.root + url);
    var character = new Character(sprite, description);
    var name = "character_" + getFilenameWithoutExtension(url);
    this.contentCache[name] = character;
};

ContentManager.prototype.loadPlatform = function (description) {
    var platform;
    // @ifdef PLATFORM_SERVER
    platform = new Platform({}, {}, description);
    // @endif
    // @ifndef PLATFORM_SERVER
    var texture = this.get(this.root + description.texture).image,
        outerTexture = this.get(this.root + description.outsideTexture).image;
    platform = new Platform(texture, outerTexture, description);
    // @endif
    this.contentCache[description.name] = platform;
    this._notifyLoadingProgress();
};

ContentManager.prototype.loadKeybindings = function (keybindings) {
    var keybindingsKey = "keybindings";
    this.contentCache[keybindingsKey] = keybindings;
};

ContentManager.prototype.fetchJSONFile = function (path, responseType) {
    path = this.root + path;
    var deferred = Q.defer();

    var onload = function () {
        if (xhr.status === 200) {
            if (responseType !== undefined) {
                deferred.resolve(xhr.response);
            }
            else {
                var data = "Object(" + xhr.responseText + ")";
                data = eval(data); // jshint ignore: line
                data.thisIsSparta = path;
                deferred.resolve(data);
            }
        }
        else {
            Loggers.Debug.warn("Couldn't fetch json file: {0}. Error code: {1}",
                               path,
                               xhr.status);
            deferred.reject(new Error(xhr.status));
        }
    };
    var onerror = function () {
        var message = "Couldn't fetch json file: {0}" +
                      "due to networking problems";
        Loggers.Debug.warn(message, path);
        deferred.reject(new Error());
    };

    var xhr = new XMLHttpRequest();
    xhr.open("GET", path);
    xhr.onload = onload;
    xhr.onerror = onerror;
    if (responseType !== undefined) {
        xhr.responseType = responseType;
    }
    xhr.send();
    return deferred.promise;
};

ContentManager.prototype.loadPregameData = function (spritesFilePath,
                                                     charactersFilePath,
                                                     backgroundPath) {

    if (this._loadingDeferred !== null) {
        var message = "Pregame data must be loaded before core game data!";
        Loggers.Debug.error(message);
        throw new Error(message);
    }
    var deferred = Q.defer();

    var backgroundPromise = this.loadSprite(backgroundPath);
    var charactersPromise = this.fetchJSONFile(spritesFilePath)
        .then(function (sprites) {
            return Q.all(sprites.map(this.loadSprite.bind(this)));
        }.bind(this))
        .then(function () {
            return this.fetchJSONFile(charactersFilePath);
        }.bind(this))
        .then(function (charactersDescription) {
            charactersDescription.forEach(this.loadCharacter.bind(this));
        }.bind(this));
    Q.all([charactersPromise, backgroundPromise])
    .done(deferred.resolve, deferred.reject);

    return deferred.promise;
};

// @ifdef PLATFORM_SERVER
ContentManager.prototype.loadGameData = function (gameDataPath) {
    var deferred = Q.defer();
    this._loadingDeferred = deferred;
    var gameData = this.fetchJSONServer(gameDataPath);

    var characterLibrary = this.fetchJSONServer(gameData.characters);
    characterLibrary.map(this.loadCharacter.bind(this));

    var spellLibrary = this.fetchJSONServer(gameData.spells);
    spellLibrary.map(this.loadSpell.bind(this));

    var achievementLibrary = this.fetchJSONServer(gameData.achievements);
    achievementLibrary.map(this.loadAchievementCategory.bind(this));

    var platform = this.fetchJSONServer(gameData.platform);

    this.loadPlatform(platform, true);
    deferred.resolve();
    return deferred.promise;
};
// @endif
// @ifndef PLATFORM_SERVER
ContentManager.prototype.loadGameData = function (gameDataPath) {
    var deferred = Q.defer();
    this._loadingDeferred = deferred;
    this._loading = 1; // the platform
    this._loaded = 0;

    var self = this;
    this.fetchJSONFile(gameDataPath)
    .then(function (gameData) {
        self.loadKeybindings(gameData.keybindings);

        var spritePromise = self.fetchJSONFile(gameData.sprites)
        .then(function (sprites) {
            self._loading += sprites.length;
            return Q.all(sprites.map(self.loadSprite.bind(self)));
        });
        var audioPromise = self.fetchJSONFile(gameData.sounds)
        .then(function (sounds) {
            self._loading += sounds.length;
            return Q.all(sounds.map(self.loadAudio.bind(self)));
        });
        var resourcePromise = Q.all([spritePromise, audioPromise]);

        var achievementPromise = self.fetchJSONFile(gameData.achievements)
        .then(function (categories) {
            self._loading += categories.length;
            return Q.fcall(function () {
                categories.forEach(self.loadAchievementCategory.bind(self));
            });
        });

        var spellPromise = self.fetchJSONFile(gameData.spells)
        .then(function (spellLibrary) {
            self._loading += spellLibrary.length;
            return resourcePromise.then(function () {
                return Q.fcall(function () {
                    spellLibrary.forEach(self.loadSpell.bind(self));
                });
            });
        });
        var platformPromise = self.fetchJSONFile(gameData.platform)
        .then(function (platform) {
            return resourcePromise.then(function () {
                return Q.fcall(function () {
                    self.loadPlatform(platform);
                });
            });
        });
        return Q.all([
            achievementPromise,
            spellPromise,
            platformPromise
         ]);
    })
    .then(function () {
        return Q.delay(1000000);
    }).done(deferred.resolve, deferred.reject);

    return deferred.promise;
};
// @endif

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
    return this.getLibrary(Spell);
};

ContentManager.prototype.getAchievementLibrary = function () {
    return this.getLibrary(Achievement);
};

ContentManager.prototype.getCharacters = function () {
    return this.getLibraryArray(Character);
};

ContentManager.prototype.getLibrary = function (type) {
    var lib = {};
    for (var path in this.contentCache) {
        var content = this.contentCache[path];
        if (content instanceof type) {
            lib[content.name || path] = content;
        }
    }

    return lib;
};

ContentManager.prototype.getLibraryArray = function (type) {
    var lib = [];
    for (var path in this.contentCache) {
        var content = this.contentCache[path];
        if (content instanceof type) {
            lib.push(content);
        }
    }

    return lib;
};

module.exports = ContentManager;
