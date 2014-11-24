"use strict";
var FirstPageController = function() {
    
};

FirstPageController.run = function() {
    // var name = $("#name").val();
    // console.log(name);
}

FirstPageController.bindListeners = function() {
    $("#playButton").on("click", function() {
        var name = $("#name").val();
        client.socket.emit("getPlayer", {playerName: name});
    });

    $("#azureButton").on("click", function() {
        var azureController = new AzureManager();
        azureController.login();
        console.log("clicked");
    });

    $("#name").keydown(function(event) {
        if(event.keyCode == 13 /*Enter*/) {
            var name = $("#name").val();
            client.socket.emit("getPlayer", {playerName: name});
        }
    });

    client.socket.on('getPlayer', function(data){
        client.playerId = data.playerId;
        client.playerName = data.playerName;
        
        client.load("src/game_client/please_wait.html");
    });
}

FirstPageController.bindListeners();