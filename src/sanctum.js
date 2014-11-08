var sanctum = sanctum || {};

Actions = {
    walk: "walk",
    spellcast1: "spellcast1",
    spellcast2: "spellcast2",
    spellcast3: "spellcast3",
    spellcast4: "spellcast4",
    spellcast5: "spellcast5",
    spellcast6: "spellcast6",
};

sanctum.Game = function (context, playerCount) {
    Resizer.installHandler(context.canvas);

    this.objects = []; // The first playerCount indices hold the characters
    this.playerCount = playerCount;
    this.previousTime = 0;
    this.playerObjectIndex = 0;
    this.nextAction = Actions.walk;
    this.spellBindings = {};
    this.keybindings = {};

    this.contentManager = new sanctum.ContentManager();
    this.physicsManager = new sanctum.PhysicsManager();
    this.effectManager = new sanctum.EffectManager();
    this.input = new sanctum.InputManager();
    this.renderer = new sanctum.Renderer(context);     
};

var OBJECTS = {
    "monk": "character_monk",
    "fireball": "content/art/spells/fireball.png",
    "platform": "Basic platform",
}

sanctum.Game.prototype.init = function () {
    this.platform = this.contentManager.get(OBJECTS["platform"]);

    var monk = this.contentManager.get(OBJECTS["monk"]);
    this.objects.push(monk);
    var enemy = monk.clone();
    enemy.position = new Vector(500, 500);
    this.objects.push(enemy);
    var spellLibrary = this.contentManager.getSpellLibrary();
    monk.sprite.activeAnimation = monk.animations.walk;
    
    this.keybindings = this.contentManager.get("keybindings");
    this.effectManager.init(spellLibrary);
    this.input.init();
    this.run(0);
}

sanctum.Game.prototype.loadContent = function () {
    this.contentManager.loadGameData("game_data.json", this.init.bind(this));
}

sanctum.Game.prototype.handleInput = function () {
    for (var key in this.keybindings) {
        if (this.input.keyboard[this.input.keyNameToKeyCode(key)]) {
            this.nextAction = Actions[this.keybindings[key]];
        }
    }

    if (this.input.mouse.left && !this.input.previousMouse.left) {
        var player = this.objects[this.playerObjectIndex];
        switch (this.nextAction) {
            case Actions.walk:
                player.velocity = this.input.mouse.absolute.subtract(player.position);
                Vector.normalize(player.velocity);
                Vector.multiply(player.velocity, 10, player.velocity); // magic;
                player.playAnimation(Actions.walk, player.velocity.normalized());
                break;
            default:
                var spellName = this.spellBindings[this.nextAction];
                var spell = this.effectManager.castSpell(this.objects[this.playerObjectIndex],
                                                         spellName,
                                                         this.input.mouse.absolute);
                this.objects.push(spell);
                var forward = spell.position.subtract(player.position).normalized();
                player.playAnimation(this.nextAction, forward);
        }
        this.nextAction = Actions.walk;
    }
    this.input.swap();
}

sanctum.Game.prototype.bindSpells = function (cast1, cast2, cast3, cast4, cast5, cast6) {
    for (var i = 0; i < arguments.length; i++) { // magic, fix the number of casts
        this.spellBindings["spellcast" + (i + 1)] = arguments[i];
    }
};

sanctum.Game.mainGameLoop = function () {};
sanctum.Game.prototype.loop = function (timestamp) {
    var delta = timestamp - this.previousTime;
    
    this.handleInput();
    this.platform.update(delta);
    this.physicsManager.update(this.objects);
    this.effectManager.applyEffects(this.physicsManager, this.objects);
    var viewportCenter = this.renderer.getViewportCenter();
    this.effectManager.applyPlatformEffect(this.physicsManager,
                                           this.platform, 
                                           this.objects,
                                           this.playerCount,
                                           viewportCenter
                                           );
    this.renderer.render(this.platform, this.objects, delta);
    
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
game.bindSpells("Fireball", "Freeze", "Frostbolt", 
                "Heal", "Speed up!", "Healing well");

function testCast() {
    m = game.objects[0];
    e = game.effectManager;
    p = game.physicsManager;
    game.objects.push(e.castSpell(m, "fireball", new Vector(0, 0)));
}