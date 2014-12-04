@echo off
echo Running tests...
start "" /w /b node_modules\.bin\mocha --ui bdd --colors test\main.js
@echo on