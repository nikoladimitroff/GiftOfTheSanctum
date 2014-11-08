var RoomController = function() {
    this.players = [];
}

RoomController.prototype.init = function() {
    client.socket.on("roomUpdated", this.roomUpdated.bind(this));
    client.socket.on("welcome", this.handleWelcome.bind(this));
    client.socket.on("updateHost", this.updateHost.bind(this));
    client.socket.on("play", this.handlePlay.bind(this));

    client.socket.emit("welcome", {playerName: client.playerName, playerId: client.socket.io.engine.id});

    $("#startGame").on("click", function() {
        client.socket.emit("play");
    });
}

RoomController.prototype.handleWelcome = function(data) {
    client.isHost = data.isHost;
    this.renderHost();
}

RoomController.prototype.updateHost = function(data) {
    client.isHost = data.isHost;
    this.renderHost();
}

RoomController.prototype.handlePlay = function() {
    $("#content").remove();
    $("body").append('<canvas id="game-canvas" width="800px" height="800px">Your browser does not support the canvas element. Consider upgrading your IE6.</canvas>');
    
    startAll();
}

RoomController.prototype.roomUpdated = function(data) {
    var displayPlayers = "";
    var players = data.players;

    for(var i = 0; i < players.length; i++) {
        displayPlayers += "<div class='player-row'>" +
            "<img class='player-row-image' src='content/art/characters/monk_avatar.png'/>" + 
            "<div class='player-row-name'>" +
                players[i].name
            + "</div></div>";

    }

    $(".players").html(displayPlayers);
}

RoomController.prototype.renderHost = function() {
    if(client.isHost) {
        $("#startGame").removeClass("disabled");
        $("#startGame").addClass("active");
    } else {
        $("#startGame").removeClass("active");
        $("#startGame").addClass("disabled");
    }
    
}

var roomController = new RoomController();
roomController.init();

