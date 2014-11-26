"use strict";
client.socket.on('getRoom', function(data) {  
    client.roomId = data.roomId;

    client.socket = io.connect("/" + client.roomId, {port : sanctum.NetworkManager.port});

    client.socket.on("connect", function() {
        client.load("src/public/lobby.html");
    });
});

client.socket.emit("getRoom", {playerId: client.playerId});
