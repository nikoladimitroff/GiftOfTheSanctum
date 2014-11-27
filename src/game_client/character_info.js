"use strict";

$(document).ready(function () {
    $("#health_container").load("src/game_client/health_orb.html");
    $("#spell_info").load("src/game_client/spell_info.html");
    $("#spell_shop").load("src/game_client/spell_shop.html");
    $("#health_orb").click(function () {
        var min = 41.5;
        var max = 57.6;
        var factor = (max - min) / 100;
        var result = (min + factor * Math.random());
        $(this).animate({"background-position-y": result + "%"}, 500)
    });
});
