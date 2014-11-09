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
    $("#content").remove();
    $("body").append('<canvas id="game-canvas" width="800px" height="800px">Your browser does not support the canvas element. Consider upgrading your IE6.</canvas>');
    
    console.log(sanctum);

    var networkManager = new sanctum.NetworkManager();
    networkManager.connect(null, client.socket);

    startAll(this.players.length, this.findSelfIndex(), networkManager);
}

RoomController.prototype.handleChat = function(data) {
    if(data && data.message) {
        $("#chat").val($("#chat").val() + data.message + "\n");
        $("#chat").scrollTol($("#chat")[0].scrollHeight);
    }
}

RoomController.prototype.roomUpdated = function(data) {
    var displayPlayers = "";
    this.players = data.players;

    for(var i = 0; i < this.players.length; i++) {
        displayPlayers += "<div class='player-row'>" +
            "<img class='player-row-image' src='content/art/characters/lobby/"+ 
            this.avatar_images[i] + "'/>" + 
            "<div class='player-row-name'>" +
                this.players[i].name
            + "</div></div>";

    }

    $(".players").html(displayPlayers);
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
