@echo off
echo Checking your code...
echo Running JS Hint
start "" /w /b node_modules\.bin\jshint src/
echo Running JSCS
start "" /w /b node_modules\.bin\jscs src/ --config=.jscsrc
@echo on