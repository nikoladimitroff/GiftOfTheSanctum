var sanctum = {};

var physicsManager = require("./physics_manager");
var effectManager =  require("./effect_manager");
var contentManager = require("./content_manager");
var inputManager = require("./input_manager");
var renderer = require("./renderer");

sanctum.PhysicsManager = physicsManager;
sanctum.EffectManager = effectManager;
sanctum.ContentManager = contentManager;
sanctum.InputManager = inputManager;
sanctum.Renderer = renderer;

module.exports = sanctum;