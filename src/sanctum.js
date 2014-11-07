var sanctum = sanctum || {};

sanctum.Game = function (context) {
    this.characters = [];
    this.objects = [];
    
    this.previousTime = 0;

    this.contentManager = new sanctum.ContentManager();
    this.physicsManager = new sanctum.PhysicsManager();
    this.renderer = new sanctum.Renderer(context);
};

var OBJECTS = {
    "monk": "character_monk",
    "fireball": "content/art/spells/fireball.png",
}

sanctum.Game.prototype.init = function () {
    var monk = this.contentManager.get(OBJECTS["monk"]);
    this.characters.push(monk);
    monk.sprite.activeAnimation = monk.animations.walk;
    this.run(0);
}

sanctum.Game.prototype.loadContent = function () {
    this.contentManager.loadAssets("assets.json", this.init.bind(this));
}

sanctum.Game.mainGameLoop = function () {};
sanctum.Game.prototype.loop = function (timestamp) {
    var delta = timestamp - this.previousTime;
    this.physicsManager.update(this.objects);
    this.renderer.render([this.characters, this.objects], delta);
    
    this.previousTime = timestamp;
    requestAnimationFrame(sanctum.Game.mainGameLoop);
}

sanctum.Game.prototype.run = function () {
    sanctum.Game.mainGameLoop = this.loop.bind(this);
    sanctum.Game.mainGameLoop(0);
}

var canvas = document.getElementById("game-canvas");
var game = new sanctum.Game(canvas.getContext("2d"));
game.loadContent();