io.on('enterTheRoom', function(socket){
  console.log('a user connected');
  socket.broadcast.emit('getInRoom');
});