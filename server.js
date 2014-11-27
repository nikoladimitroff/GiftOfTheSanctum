var express = require("express");

var app = express();
app.use(express.static(__dirname));
// app.use(express.static(__dirname + "index.html"));
// app.use(express.static(__dirname + "/content"));
// app.use(express.static(__dirname + "/3rdparty"));
// app.use(express.static(__dirname + "/src"));

var http = require("http");
var network = require("./src/game/network_manager");

var main = require("./src/game/main");

var server = http.createServer(app).listen(network.port);

var io = require("socket.io").listen(server);

io.sockets.on('connection', function(socket) {
    main.start(io, socket);
});

console.log("Server Running on " + network.port);