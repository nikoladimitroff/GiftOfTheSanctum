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
    "monk": {
        src: "content/art/characters/monk.png",
        framesPerRow: [
            7, 7, 7, 7,
            8, 8, 8, 8, 
            9, 9, 9, 9,
            6, 6, 6, 6,
            13, 13, 13, 13,
            6,
        ]
    },
    "fireball": {
        src: "content/art/spells/fireball.png",
        framesPerRow: [
            8, 8, 8, 8, 
            8, 8, 8, 8, 
        ]
    }
}

sanctum.Game.prototype.init = function () {
    var monk = this.contentManager.get(OBJECTS["monk"].src);
    var fireball = this.contentManager.get(OBJECTS["fireball"].src);
    this.characters.push(new sanctum.Character(monk));
    this.objects.push(new sanctum.Spell(fireball));
    this.run(0);
}

sanctum.Game.prototype.loadContent = function () {
    this.contentManager.onload = this.init.bind(this);
    this.contentManager.loadSprite(OBJECTS["monk"]);
    this.contentManager.loadSprite(OBJECTS["fireball"]);
}

sanctum.Game.mainGameLoop = function () {};
sanctum.Game.prototype.loop = function (timestamp) {
    var delta = timestamp - this.previousTime;
    console.log(delta);
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