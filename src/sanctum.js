var sanctum = sanctum || {};

Actions = {
    walk: "walk",
    spellcast1: "spellcast1",
    spellcast2: "spellcast2",
    spellcast3: "spellcast3",
    spellcast4: "spellcast4",
};

sanctum.Game = function (context, playerCount) {
    Resizer.installHandler(context.canvas);

    this.objects = []; // The first playerCount indices hold the characters
    this.playerCount = playerCount;
    this.previousTime = 0;
    this.playerObjectIndex = 0;
    this.waitingForAction = Actions.walk;

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
    var enemy = monk.clone();
    enemy.position = new Vector(500, 500);
    this.objects.push(enemy);
    var spellLibrary = this.contentManager.getSpellLibrary();
    monk.sprite.activeAnimation = monk.animations.walk;
    
    this.effectManager.init(spellLibrary);
    this.input.init();
    this.run(0);
}

sanctum.Game.prototype.loadContent = function () {
    this.contentManager.loadAssets("assets.json", this.init.bind(this));
}

sanctum.Game.prototype.handleInput = function () {
    if (this.input.keyboard[this.input.keyNameToKeyCode("Q")])
        this.waitingForAction = Actions.spellcast1;
        
    if (this.input.keyboard[this.input.keyNameToKeyCode("W")])
        this.waitingForAction = Actions.spellcast2;

    if (this.input.mouse.left && !this.input.previousMouse.left) {
        var player = this.objects[this.playerObjectIndex];
        switch (this.waitingForAction) {
            case Actions.walk:
                player.velocity = this.input.mouse.absolute.subtract(player.position);
                Vector.normalize(player.velocity);
                Vector.multiply(player.velocity, 10, player.velocity); // magic;
                player.playAnimation(Actions.walk, player.velocity.normalized());
                break;
            case Actions.spellcast1:
                var spell = this.effectManager.castSpell(this.objects[this.playerObjectIndex],
                                                         "flamestrike",
                                                         this.input.mouse.absolute);
                this.objects.push(spell);
                player.playAnimation(Actions.spellcast1, spell.position.subtract(player.position).normalized());
                break;
            case Actions.spellcast2:
                var spell = this.effectManager.castSpell(this.objects[this.playerObjectIndex],
                                                         "freeze",
                                                         this.input.mouse.absolute);
                this.objects.push(spell);
                player.playAnimation(Actions.spellcast2, spell.position.subtract(player.position).normalized());
        }
        this.waitingForAction = Actions.walk;
    }
    this.input.swap();
}

sanctum.Game.mainGameLoop = function () {};
sanctum.Game.prototype.loop = function (timestamp) {
    var delta = timestamp - this.previousTime;
    
    this.handleInput();
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