var isScoreShowed = false;
var displayBoard;
var avatar_images = ["archer.png", "knight.png", "mage.png", "monk.png",
     "necro.png", "orc.png", "queen.png", "rogue.png"];
var playersScore = [10,5,15,20];

var TAB_KEY = 9;

$(document).bind('keydown', function(e) {
    e.preventDefault();
    if(e.keyCode === TAB_KEY && !isScoreShowed /*Enter*/){
        scoreBoardShows(playersScore);
        isScoreShowed = true;
     }
     else if(e.keyCode === TAB_KEY && isScoreShowed){
        isScoreShowed = false;
        scoreBoardDissapear();
     }
});

var scoreBoardShows = function(data){
    displayBoard = "<div id = 'my-element'>";
    var score = data;

    for(var i = 0; i < data.length; i++) {
        displayBoard += "<div class='board'>" + 
        "<div class='player-score'>" + "Score: " +
            score[i]
             + "<img class='player-img' src='../../content/art/characters/scoreboard/" + this.avatar_images[i] + "'/></div></div>";
    }
    displayBoard+="</div>"

    $(".container_board").html(displayBoard);
}

var scoreBoardDissapear = function(){
   document.getElementById("my-element").remove();
}