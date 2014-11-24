node_modules\.bin\lessc src\public\style\main.less > src\public\style\main.css
node_modules\.bin\jscs src\* --config=jscs.json
node_modules\.bin\browserify src\sanctum.js -o client.js --debug

