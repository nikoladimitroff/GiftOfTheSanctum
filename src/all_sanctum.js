var sanctum = {};

var physicsManager = require("./physics_manager");
var effectManager =  require("./effect_manager");
var inputManager = require("./input_manager");
var renderer = require("./renderer");
var contentManager = require("./content_manager");

sanctum.PhysicsManager = physicsManager;
sanctum.EffectManager = effectManager;
sanctum.ContentManager = contentManager;
sanctum.InputManager = inputManager;
sanctum.Renderer = renderer;

// console.log(sanctum);

module.exports = sanctum;