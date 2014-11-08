client.socket.on('getRoom', function(data){
  console.log('a user connected');
  var roomId = data.roomId;

  io.connect("/" + roomId, {port : 8080});
});

client.socket.emit("getRoom", {playerId: playerId});