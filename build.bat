@echo off
echo Build started...
echo Building js code
start "" /w /b node_modules\.bin\browserify src\game_client\client.js -o distr\client.js
echo Building css
start "" /w /b node_modules\.bin\lessc src\game_client\style\main.less > distr\main.css
echo Copying fonts
robocopy src\game_client\style\fonts distr\fonts > nul
echo Build complete!
