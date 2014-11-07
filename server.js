http = require("http");
network = require("./src/network_manager.js");

var main = require("./src/main");

var server = http.createServer(function(request, response) {
    console.log("Request received");
    response.writeHeader(200, {"Content-Type": "text/plain"});
    response.write("Hello World");
    response.end();
}).listen(network.port);

var io = require("socket.io").listen(server);

io.sockets.on('connection', function(socket) {
	main.start(socket);
});

console.log("Server Running on " + network.port);