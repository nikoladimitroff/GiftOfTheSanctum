var networking = require("./networking_objects.js");

var Main = function() {
	this.socket = null;
	this.rooms = {};
	this.players = {};
}

Main.prototype.firstFreeRoom = function() {
	for(var i = 0, length = this.rooms.length; i < length; i++) {
		if(this.rooms[i].isFree()) {
			return this.rooms[i];
		}
	}
}

Main.prototype.getPlayer = function(data) {
	if(data && data.playerName) {
		var player = new networking.Player(data.playerName);
		this.players[player.id] = player;
		this.socket.emit("getPlayer", { playerId: player.id, playerName: player.name });
	}
}

Main.prototype.getRoom = function(data) {
	if(data && data.playerId && this.players[data.playerId]) {
		var room = this.firstFreeRoom() || new networking.Room();
		this.rooms[room.id] = this.rooms[room.id] || room;
		this.players[data.playerId].roomId = room.id;
		room.players.push(this.players[data.playerId]);
		this.socket.emit("getRoom", { roomId: room.id })
	}
}

Main.prototype.start = function(socket) {
	this.socket = socket;
	this.socket.emit("connected", { message: "Hi" });
	this.socket.on("getRoom", this.getRoom.bind(this));
	this.socket.on("getPlayer", this.getPlayer.bind(this));
}

module.exports = new Main();