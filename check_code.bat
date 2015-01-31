@echo off
echo Checking your code...
echo Running JS Hint
start "" /w /b node_modules\.bin\jshint src\game src\game_client src\utils src\wp_client\js editor/
echo Running JSCS
start "" /w /b node_modules\.bin\jscs src\game src\game_client src\utils src\wp_client\js editor/ --config=.jscsrc
@echo on