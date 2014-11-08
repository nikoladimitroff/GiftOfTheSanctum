var networkManager = require("./network_manager");

var main = function() {
    this.socket = null;
}

main.prototype.start = function(socket) {
    this.socket = socket;
    this.socket.emit("connected", {message : "Hi"});
    
    networkManager.setup(this.socket);
}

module.exports = new main();