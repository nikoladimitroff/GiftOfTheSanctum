var RoomController = function() {
	this.players = [];
}

RoomController.prototype.init = function() {
	client.socket.on("roomUpdated", this.roomUpdated.bind(this));
	client.socket.on("welcome", this.handleWelcome.bind(this));
	client.socket.on("updateHost", this.updateHost.bind(this));

	client.socket.emit("welcome", {playerName: client.playerName, playerId: client.socket.io.engine.id});
}

RoomController.prototype.handleWelcome = function(data) {
	client.isHost = data.isHost;
	this.renderHost();
}

RoomController.prototype.renderHost = function() {
	if(client.isHost) {
		$("#startButton").removeClass("disabled");
		$("#startButton").addClass("active");
	} else {
		$("#startButton").removeClass("active");
		$("#startButton").addClass("disabled");
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
		displayPlayers += "<div class='player-row'>" + players[i].name + "</div>";
	}

	$(".players").html(displayPlayers);
}

var roomController = new RoomController();
roomController.init();

