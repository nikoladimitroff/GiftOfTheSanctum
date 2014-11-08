var RoomController = function() {
	this.players = [];
}

RoomController.prototype.init = function() {
	client.socket.on("roomUpdated", this.roomUpdated.bind(this));

	client.socket.emit("welcome", {playerName: client.playerName, playerId: client.socket.io.engine.id});

	if(!client.isHost) {
		$("#startButton").addClass("disabled");
	} else {
		$("#startButton").addClass("active");
	}
}

RoomController.prototype.roomUpdated = function(data) {
	var displayPlayers = "";
	var players = data.players;

	for(var i = 0; i < players.length; i++) {
		displayPlayers += "<div class='player-row'>" + players[i].name + "</div>";
	}

	$(".players").html(displayPlayers);
}

var roomController = new RoomController();
roomController.init();

