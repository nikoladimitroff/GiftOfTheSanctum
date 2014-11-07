var sanctum = sanctum || {};

sanctum.Character = function (sprite) {
    this.position = new Vector(200, 200);
    this.sprite = sprite;
};

sanctum.Spell = function (sprite) {
    this.position = new Vector(300, 300);
    this.velocity = new Vector(1, 1);
    this.acceleration = new Vector(0, 0);
    this.sprite = sprite;
}