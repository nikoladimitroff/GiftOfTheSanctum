var FirstPageController = function() {
	
};

FirstPageController.run = function() {
	// var name = $("#name").val();
	// console.log(name);
}

FirstPageController.bindListeners = function() {
	$("#playButton").on("click", function() {
		var name = $("#name").val();
		client.socket.emit("nameOfPlayer", name);
	 	console.log(name);
	 	client.load("src/public/please_wait.html")
	});
}

FirstPageController.bindListeners();