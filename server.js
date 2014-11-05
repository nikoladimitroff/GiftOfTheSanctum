http = require("http");
network = require("./src/network_manager.js")

http.createServer(function(request, response) {
    console.log("Request received");
    response.writeHeader(200, {"Content-Type": "text/plain"});
    response.write("Hello World");
    response.end();
}).listen(network.port);

console.log("Server Running on " + network.port);