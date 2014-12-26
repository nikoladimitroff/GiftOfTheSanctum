"use strict";
var GameState = {
    playing: "playing",
    midround: "midround",
    gameover: "gameover"
};

var Action = {
    walk: "walk",
    idle: "idle",
    spellcast1: "spellcast1",
    spellcast2: "spellcast2",
    spellcast3: "spellcast3",
    spellcast4: "spellcast4",
    spellcast5: "spellcast5",
    spellcast6: "spellcast6",
};

module.exports = {
    Action: Action,
    GameState: GameState
};
