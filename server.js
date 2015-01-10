var express = require("express");

var app = express();
app.use(express.static(__dirname));
// app.use(express.static(__dirname + "index.html"));
// app.use(express.static(__dirname + "/content"));
// app.use(express.static(__dirname + "/3rdparty"));
// app.use(express.static(__dirname + "/src"));

var http = require("http");
var network = require("./src/game/network_manager");

var LobbyNetworker = new require("./src/game/lobby_networker");
var lobbyNetworker = new LobbyNetworker();

var server = http.createServer(app).listen(network.port);

var io = require("socket.io").listen(server);

io.sockets.on('connection', function(socket) {
    lobbyNetworker.start(io, socket);
});

console.log("Server Running on " + network.port);