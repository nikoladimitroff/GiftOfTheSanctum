$(document).ready(function () {
    $("#health_container").load("src/public/health_orb.html");
    $("#spell_info").load("src/public/spell_info.html");
    $("#health_orb").click(function(){
        var min = 41.5;
        var max = 57.6;
        var factor = (max - min) / 100;
        var result = (min + factor * Math.random());
        $(this).animate({'background-position-y': result + "%"}, 500) 
    });
});