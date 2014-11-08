var networkManager = require("./network_manager");

var main = function() {
    this.sockets = [];
}

var test = function() {
    console.log("asd");
    networkManager.addObject({position: 5, velocity: 0.3, id: "12345"});
    networkManager.flush();
    setTimeout(test, 1000);
}

main.prototype.start = function(io, socket) {
    this.sockets.push(socket);

    networkManager.setup(io, socket);

    setTimeout(test, 1000);
}

module.exports = new main();