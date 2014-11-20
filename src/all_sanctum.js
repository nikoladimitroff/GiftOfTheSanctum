var sanctum = {};

var physicsManager = require("./physics_manager");
var effectManager =  require("./effect_manager");
var inputManager = require("./input_manager");
var renderer = require("./renderer");
var contentManager = require("./content_manager");
var uiManager = require("./ui_manager");
var playerManager = require("./player_manager");
var predictionManager = require("./prediction_manager");

sanctum.PredictionManager = predictionManager;
sanctum.PhysicsManager = physicsManager;
sanctum.EffectManager = effectManager;
sanctum.ContentManager = contentManager;
sanctum.InputManager = inputManager;
sanctum.UIManager = uiManager;
sanctum.Renderer = renderer;
sanctum.PlayerManager = playerManager;

// console.log(sanctum);

module.exports = sanctum;