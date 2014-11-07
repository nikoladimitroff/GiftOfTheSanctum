var sanctum = sanctum || {};

sanctum.Character = function (sprite, animations) {
    this.position = new Vector(200, 200);
    this.sprite = sprite;
    this.animations = animations;
};

sanctum.Spell = function (sprite) {
    this.position = new Vector(300, 300);
    this.velocity = new Vector(10, 10);
    this.acceleration = new Vector(0, 0);
    this.sprite = sprite;
}