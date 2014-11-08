var sanctum = sanctum || {};

sanctum.Game = function (context, playerCount) {
    this.objects = []; // The first playerCount indices hold the characters
    this.playerCount = playerCount;
    this.previousTime = 0;

    this.contentManager = new sanctum.ContentManager();
    this.physicsManager = new sanctum.PhysicsManager();
    this.effectManager = new sanctum.EffectManager();
    this.input = new sanctum.InputManager();
    this.renderer = new sanctum.Renderer(context);
};

var OBJECTS = {
    "monk": "character_monk",
    "fireball": "content/art/spells/fireball.png",
}

sanctum.Game.prototype.init = function () {
    var monk = this.contentManager.get(OBJECTS["monk"]);
    this.objects.push(monk);
    var spellLibrary = this.contentManager.getSpellLibrary();
    monk.sprite.activeAnimation = monk.animations.walk;
    
    this.effectManager.init(spellLibrary);
    this.input.init();
    this.run(0);
}

sanctum.Game.prototype.loadContent = function () {
    this.contentManager.loadAssets("assets.json", this.init.bind(this));
}

sanctum.Game.mainGameLoop = function () {};
sanctum.Game.prototype.loop = function (timestamp) {
    var delta = timestamp - this.previousTime;
    this.physicsManager.update(this.objects);
    this.effectManager.applyEffects(this.physicsManager, this.objects);
    this.renderer.render(this.objects, delta);
    
    this.previousTime = timestamp;
    requestAnimationFrame(sanctum.Game.mainGameLoop);
}

sanctum.Game.prototype.run = function () {
    sanctum.Game.mainGameLoop = this.loop.bind(this);
    sanctum.Game.mainGameLoop(0);
}

var canvas = document.getElementById("game-canvas");
var game = new sanctum.Game(canvas.getContext("2d"), 1);
game.loadContent();

function testCast() {
    m = game.objects[0];
    e = game.effectManager;
    p = game.physicsManager;
    game.objects.push(e.castSpell(m, "fireball", new Vector(0, 0)));
}