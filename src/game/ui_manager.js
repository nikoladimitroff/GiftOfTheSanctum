"use strict";

var UIManager = function (model, events) {
    this.model = model;
    events.roundOver.addEventListener(this.showScoreboard.bind(this));
};

UIManager.prototype.init = function () {
    this.scoreboard = document.querySelector("#scoreboard");

    var innerHTML = "<span></span><img></img><span></span>";
    for (var i = 0; i < this.model.scores.length; i++) {
        var playerLabel = document.createElement("li");
        playerLabel.innerHTML = innerHTML;
        this.scoreboard.appendChild(playerLabel);
    }
};

var avatar_images = ["archer.png", "knight.png", "mage.png", "monk.png",
     "necro.png", "orc.png", "queen.png", "rogue.png"];


UIManager.prototype.showScoreboard = function () {
    $(this.scoreboard).toggle();
    var playerLabels = this.scoreboard.children;

    for(var i = 0; i < this.model.scores.length; i++) {
        var labelIndex = i + 1;
        playerLabels[labelIndex].children[0].textContent = this.model.scores[i].name;
        var imgSource = "content/art/characters/scoreboard/" + avatar_images[this.model.scores[i].id];
        playerLabels[labelIndex].children[1].src = imgSource;
        playerLabels[labelIndex].children[2].textContent = this.model.scores[i].score;
    }
};

function removeAllChildren(node) {
    var last;
    while (last = node.lastChild)
        node.removeChild(last);
}


module.exports = UIManager;
