var RoomController = function() {
    this.players = [];
}

RoomController.prototype.init = function() {
    client.socket.on("roomUpdated", this.roomUpdated.bind(this));
    client.socket.on("welcome", this.handleWelcome.bind(this));
    client.socket.on("updateHost", this.updateHost.bind(this));

    client.socket.emit("welcome", {playerName: client.playerName, playerId: client.socket.io.engine.id});

    $("#startGame").on("click", function() {
        client.socket.emit("play");
    });
}

RoomController.prototype.handleWelcome = function(data) {
    client.isHost = data.isHost;
    this.renderHost();
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

RoomController.prototype.updateHost = function(data) {
    client.isHost = data.isHost;
    this.renderHost();
}

RoomController.prototype.roomUpdated = function(data) {
    var displayPlayers = "";
    var players = data.players;

    for(var i = 0; i < players.length; i++) {
        displayPlayers += "<div class='player-row'>" +
            "<img class='player-row-image' src='content/art/home_wallpaper.jpg'/>" + 
            "<div class='player-row-name'>" +
                players[i].name
            + "</div></div>";

    }

    $(".players").html(displayPlayers);
}

var roomController = new RoomController();
roomController.init();

