var sanctum = require("./all_sanctum") || sanctum;

sanctum = sanctum || {};

sanctum.UIManager = function (model, events) {
    events.roundOver.addEventListener(this.showScoreboard.bind(this));
};
        
sanctum.UIManager.prototype.showScoreboard = function (players) {
    $(".scoreboard").toggle();
    scoreBoardShows(players);
};
    
var isScoreShowed = false;
var displayBoard;
var avatar_images = ["archer.png", "knight.png", "mage.png", "monk.png",
     "necro.png", "orc.png", "queen.png", "rogue.png"];
var playersScore = [10,5,15,20];

var TAB_KEY = 9;

var scoreBoardShows = function(players){
    displayBoard = "<div id = 'my-element'>";

    for(var i = 0; i < players.length; i++) {
        displayBoard += "<div class='board'>" + 
        "<div class='player-score'>" + "Score: " +
            players[i].score
             + "<img class='player-img' src='../../content/art/characters/scoreboard/" + avatar_images[i] + "'/></div></div>";
    }
    displayBoard += "</div>"

    $(".scoreboard").html(displayBoard);
}

var scoreBoardDissapear = function(){
   document.getElementById("my-element").remove();
}