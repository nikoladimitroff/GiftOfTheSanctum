"use strict";
var Vector = require("./math/vector");

var Platform = function (texture, outsideTexture, description) {
    this.outsideDamage = description.outsideDamage;
    this.rounds = description.rounds;

    var sides = description.sides;
    var radius = description.radius;

    this.size = new Vector(description.width, description.height);

    this.vertices = this.generateVertices(sides, radius);

    this.startingRadius = radius;
    this.startingCollapseIterations = description.collapseIterations;
    this.radius = radius;
    this.texture = texture;
    this.outsideTexture = outsideTexture;
    this.soundtrack = description.soundtrack;
    this.lastCollapse = 0;
    this.collapseIterationsLeft = description.collapseIterations;
    this.collapseInterval = description.collapseInterval;
    this.collapseRadiusReduction = radius / description.collapseIterations;
    this.width = description.width;
    this.height = description.height;
};

Platform.prototype.update = function (dt) {
    this.lastCollapse += dt;
    if (this.collapseIterationsLeft &&
        this.lastCollapse >= this.collapseInterval) {

        this.radius -= this.collapseRadiusReduction;
        this.vertices = this.generateVertices(this.vertices.length,
                                              this.radius);
        this.collapseIterationsLeft--;
        this.lastCollapse = 0;
    }
};

Platform.prototype.generateVertices = function (sides, radius, center) {
    center = center || Vector.zero;
    var vertices = [];
    for (var i = 0; i < sides; i++) {
        var angle = Math.PI / 10 + i * 2 * Math.PI / sides;
        var nextVertex = new Vector(center.x + radius * Math.cos(angle),
                                    center.y + radius * Math.sin(angle));
        vertices.push(nextVertex);
    }

    return vertices;
};

Platform.prototype.reset = function () {
    this.radius = this.startingRadius;
    this.collapseIterations = this.startingCollapseIterations;
    this.lastCollapse = 0;
    this.vertices = this.generateVertices(this.vertices.length,
                                          this.radius);
};

module.exports = Platform;
