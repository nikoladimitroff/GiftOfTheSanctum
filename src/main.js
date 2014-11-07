var main = function() {
	this.socket = null;
}

main.prototype.start = function(socket) {
	this.socket = socket;

	this.socket.emit("connected", {message : "Hi"});

}

module.exports = new main();