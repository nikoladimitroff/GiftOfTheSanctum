var network = function () {
    this.port = process.env.PORT || 8080;
    this.ip = "0.0.0.0";
};

module.exports = new network();