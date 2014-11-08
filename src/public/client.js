var Client = function() {
    this.socket = null;
    this.playerId = null;
    this.playerName = null;
    this.roomId = null;
}

Client.prototype.start = function() {
	this.socket = io.connect("", { port: 8080, transports: ["websocket"] });

    networkManager.connect(null, this.socket);

	this.load("src/public/main.html");
}

Client.prototype.load = function(path) {
    $("#content").load(path);
}

var client;

window.onload = function() {
    client = new Client();
    client.start();
}