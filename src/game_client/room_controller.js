"use strict";
var RoomController = function() {
    this.players = [];
    this.avatar_images = ["archer.png", "knight.png", "mage.png", "monk.png",
     "necro.png", "orc.png", "queen.png", "rogue.png"];
}

RoomController.prototype.init = function() {
    client.socket.on("roomUpdated", this.roomUpdated.bind(this));
    client.socket.on("welcome", this.handleWelcome.bind(this));
    client.socket.on("updateHost", this.updateHost.bind(this));
    client.socket.on("play", this.handlePlay.bind(this));
    client.socket.on("chat", this.handleChat.bind(this));

    client.socket.emit("welcome", {playerName: client.playerName, playerId: client.socket.io.engine.id});

    $(document).ready(function() {
        $("#startGame").on("click", function() {
            client.socket.emit("play");
        });

        $('#chat_form').submit(function(e) {
            e.preventDefault();
            var message = this.players[this.findSelfIndex()].name + ": " + $('#chat_text').val();
            if($('#chat_text').val() != '') {
                $('#chat_text').val('');
                $('#chat_text').focus();
                console.log(client);
                client.socket.emit("chat", { message: message });
            }
        }.bind(this))
    }.bind(this));
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
    $.get("src/game_client/game_ui.html", function (html) {
        $("#content").html(html);
    
        var networkManager = new sanctum.NetworkManager();
        networkManager.connect(null, client.socket);

        startAll(this.players.map(function (c) { return c.name; }), 
                 this.findSelfIndex(), 
                 networkManager);
    }.bind(this));
}

RoomController.prototype.handleChat = function(data) {
    if(data && data.message) {
        $("#chat").append(data.message + "\n");
        $("#chat").scrollTol($("#chat")[0].scrollHeight);
    }
}

RoomController.prototype.roomUpdated = function(data) {
    this.players = data.players;

    var playersDisplayInfo = "<div class='players-column'>";

    for(var i = 0; i < this.players.length; i++) {
        playersDisplayInfo += "<div class='player-row'>" +
            "<img class='player-row-image' src='content/art/characters/lobby/"+ 
            this.avatar_images[i] + "'/>" + 
            "<div class='player-row-name'>" +
                this.players[i].name
            + "</div></div>";

        if(i == 3) {
            playersDisplayInfo += "</div><div class='players-column'>";
        }

    }

    playersDisplayInfo += "</div>";

    $(".players").html(playersDisplayInfo);
}

RoomController.prototype.findSelfIndex = function() {
    console.log(client.socket.io.engine.id);
    console.log(this.players);
    for(var i = 0; i < this.players.length; i++) {
        if(this.players[i].id == client.socket.io.engine.id) {
            return i;
        }
    }

    return -1;
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
