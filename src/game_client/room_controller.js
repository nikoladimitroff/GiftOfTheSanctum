"use strict";

var RoomController = function () {
    this.client = null;
};

RoomController.prototype.init = function (client) {
    this.client = client;
    this.socket = client.gameSocket;
    this.playerName = client.playerName;
    this.viewmodel = client.viewmodel;
    this.findSelfIndex = client.findSelfIndex;

    this.cleanupSocketListeners();

    this.socket.on("chat", this.handleChat.bind(this));

    $(document).ready(function () {
        $("#startGame").on("click", function () {
            if (this.viewmodel.isHost()) {
                this.socket.emit("play");
            }
        }.bind(this));

        $("#leaveGame").on("click", function () {
            this.socket.emit("leave");
        }.bind(this));

        $("#view-achievements").on("click", function () {
            this.client.goToAchievementsScreen();
        }.bind(this));

        $("#chat_form").submit(function (e) {
            e.preventDefault();
            if ($("#chat_text").val() !== "") {
                var name = this.viewmodel.players()
                        [this.client.findSelfIndex()].name;
                var message = $("#chat_text").val();

                $("#chat_text").val("");
                $("#chat_text").focus();

                this.socket.emit("chat", {
                    message: {
                        author: name,
                        message: message
                    }
                });
            }
        }.bind(this));

        ko.applyBindings(this.viewmodel,
                        document.getElementById("lobby-ui"));
    }.bind(this));
};

RoomController.prototype.handleChat = function (data) {
    if (data && data.message) {
        this.viewmodel.chatMessages.push({
            author: data.message.author,
            message: data.message.message,
            timestamp: "[" + new Date().toLocaleTimeString() + "]"
        });
        $("#chat").scrollTop($("#chat")[0].scrollHeight);
    }
};

RoomController.prototype.cleanupSocketListeners = function () {
    this.socket.removeAllListeners("chat");
};

module.exports = RoomController;
