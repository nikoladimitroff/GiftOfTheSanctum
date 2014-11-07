var network = require("network");

var client = function() {
	this.socket = null;
}

client.prototype.start = function() {
	this.socket = io.connect("", { port: 8080, transports: ["websocket"] });
	console.log("dassa");
}

window.onload = function() {
	var c = new client();
	c.start();
}