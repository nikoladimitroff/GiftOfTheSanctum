var FirstPageController = function() {
    
};

var playerId;

FirstPageController.run = function() {
    // var name = $("#name").val();
    // console.log(name);
}

FirstPageController.bindListeners = function() {
    $("#playButton").on("click", function() {
        var name = $("#name").val();
        client.socket.emit("getPlayer", {playerName: name});
        // console.log(name);

    });

    client.socket.on('getPlayer', function(data){
        playerId = data.playerId;
        var playerName = data.playerName;
        
        client.load("src/public/please_wait.html");
    });
}

FirstPageController.bindListeners();