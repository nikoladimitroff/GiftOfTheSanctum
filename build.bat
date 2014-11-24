node_modules\.bin\lessc src\game_client\style\main.less > src\game_client\style\main.css
node_modules\.bin\jscs src\* --config=jscs.json
node_modules\.bin\browserify src\sanctum.js -o client.js --debug

