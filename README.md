Gift Of The Sanctum
================

An isometric real-time multilayer browser canvas game.
--------

Gift Of The Sanctum is a very dynamic battle arena for wizards. The goal of course is to be the last one standing in a constantly shrinking arena and win the unimaginable riches, kept in The Sanctum. The battle is based on rounds and in the end of each round you can choose to either upgrade your magic spells or keep the points for your final score.

Contributors
--------
It was developed during [HackFMI](http://hackfmi.com/) 4 by
* [Nikola Dimitroff](https://github.com/NikolaDimitroff)
* [Nikolay Stoykov](https://github.com/pankrator)
* [Nikolina Gyurova](https://github.com/nikup)
* [Petar Parushev](https://github.com/PeterParushev)
* [Veselin Genadiev](https://github.com/Veselin-Genadiev)
* [Mariya Paskova](https://github.com/mimipaskova)

or simply [Team 1/2 Niki](https://hackpad.com/-HackFMI-4-ZlYNXlko1RR#:h=Отбор-1/2-Ники---Room-309)

Technology stack
--------
* nodeJS
* socket.IO
* JavaScript
* HTML5 Canvas
* Azure Mobile Services

Art resources
--------
* [OpenGameArt](http://opengameart.org/)
* [Character Generator](http://gaurav.munjal.us/Universal-LPC-Spritesheet-Character-Generator/)

Deployment
--------
To run this on your localhost you need node.js, then clone this repo, navigate to the repo
and run **setup.bat**.

To build the game:
```
grunt build:platform:config // for example: build:html5:debug
```

To run a development server:
```
grunt watch
node server.js
```
(or run **dev_server.bat**)
Change **local_grunt_settings.json** to modify your `grunt watch` command.

To run the code checkers:
```
grunt check-code
```

To run the tests
```
grunt test
```