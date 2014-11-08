client.socket.on('getRoom', function(data) {  
    client.roomId = data.roomId;
    client.isHost = data.isHost;

    client.socket = io.connect("/" + client.roomId, {port : 8080});

    client.socket.on("connect", function() {
        client.load("src/public/lobby.html");
    });
});

client.socket.emit("getRoom", {playerId: client.playerId});
