"use strict";
var Vector = require("./math/vector");

function MouseData() {
    this.scroll = 0;
    this.left = false;
    this.middle = false;
    this.right = false;
    this.absolute = new Vector();
}

MouseData.prototype.copyFrom = function (data) {
    this.scroll = data.scroll;
    this.left = data.left;
    this.middle = data.middle;
    this.right = data.right;
    this.absolute.set(data.absolute);
};

var InputManager = function () {
    this.mouse = new MouseData();
    this.previousMouse = new MouseData();
    this.keyboard = [];
    this.previousKeyboard = [];

    this.completeKeyPress = function () {};
    this.completeMouseDown = function () {};
};

InputManager.prototype.init = function (camera) {
    window.addEventListener("keydown", function (args) {
        this.keyboard[args.keyCode] = true;
        // If we are awaiting key detection, raise the event
        if (this.completeKeyPress) {
            this.completeKeyPress(args.keyCode);
        }
    }.bind(this), false);

    window.addEventListener("keyup", function (args) {
        this.keyboard[args.keyCode] = false;
    }.bind(this), false);

    window.addEventListener("mousedown", function (args) {
        switch (args.button) {
            case 0:
                this.mouse.left = true;
                break;
            case 1:
                this.mouse.middle = true;
                break;
            case 2:
                this.mouse.right = true;
                break;
        }
        // If we are awaiting mouse detection, raise the event
        if (this.completeMouseDown) {
            this.completeMouseDown(args.button);
        }
    }.bind(this), false);

    window.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    }, false);

    window.addEventListener("mouseup", function (args) {
        switch (args.button) {
            case 0:
                this.mouse.left = false;
                break;
            case 1:
                this.mouse.middle = false;
                break;
            case 2:
                this.mouse.right = false;
                break;
        }
    }.bind(this), false);

    window.addEventListener("mousemove", function (args) {
        this.mouse.absolute.x = camera.position.x + args.clientX;
        this.mouse.absolute.y = camera.position.y + args.clientY;
    }.bind(this), false);

    var onscroll = function (args) {
        // formula due to http://www.sitepoint.com/html5-javascript-mouse-wheel/
        var wheelDelta = args.wheelDelta || -args.detail;
        this.mouse.scroll += Math.max(-1, Math.min(1, wheelDelta));
    }.bind(this);

    // Chrome, IE
    window.addEventListener("mousewheel", onscroll);
    // FF
    window.addEventListener("DOMMouseScroll", onscroll);
};

InputManager.prototype.detectMouseDown = function (callback) {
    // Create a new object and asign our complete key press delegate to call its completed method
    this.completeMouseDown = function () {
        callback();
        this.completeMouseDown = null;
    }.bind(this);
};

InputManager.prototype.swap = function () {
    this.previousKeyboard = Array.apply(Array, this.keyboard);
    this.previousMouse.copyFrom(this.mouse);
};

InputManager.prototype.keyCodeToKeyName = function (keyCode) {
    return InputManager.keyCodeToName[keyCode];
};

InputManager.prototype.keyNameToKeyCode = function (keyName) {
    return InputManager.keyNameToCode[keyName];
};

InputManager.generateKeyCodeToNameMapping = function () {
    var nonLetters = [];
    nonLetters[8] = "Backspace";
    nonLetters[9] = "Tab";
    nonLetters[13] = "Enter";
    nonLetters[16] = "Shift";
    nonLetters[17] = "Control";
    nonLetters[18] = "Alt";
    nonLetters[19] = "Pause/Break";
    nonLetters[20] = "Caps lock";
    nonLetters[27] = "Escape";
    nonLetters[33] = "Page up";
    nonLetters[34] = "Page down";
    nonLetters[35] = "End";
    nonLetters[36] = "Home";
    nonLetters[37] = "Left Arrow";
    nonLetters[38] = "Up Arrow";
    nonLetters[39] = "Right Arrow";
    nonLetters[40] = "Down arrow";
    nonLetters[45] = "Insert";
    nonLetters[46] = "Delete";
    nonLetters[91] = "Left Window Key";
    nonLetters[92] = "Right Window Key";
    nonLetters[93] = "Select Key";
    nonLetters[96] = "Num 0";
    nonLetters[97] = "Num 1";
    nonLetters[98] = "Num 2";
    nonLetters[99] = "Num 3";
    nonLetters[100] = "Num 4";
    nonLetters[101] = "Num 5";
    nonLetters[102] = "Num 6";
    nonLetters[103] = "Num 7";
    nonLetters[104] = "Num 8";
    nonLetters[105] = "Num 9";
    nonLetters[106] = "Num *";
    nonLetters[107] = "Num +";
    nonLetters[109] = "Num -";
    nonLetters[110] = "Num .";
    nonLetters[111] = "Num /";
    nonLetters[112] = "F1";
    nonLetters[113] = "F2";
    nonLetters[114] = "F3";
    nonLetters[115] = "F4";
    nonLetters[116] = "F5";
    nonLetters[117] = "F6";
    nonLetters[118] = "F7";
    nonLetters[119] = "F8";
    nonLetters[120] = "F9";
    nonLetters[121] = "F10";
    nonLetters[122] = "F11";
    nonLetters[123] = "F12";
    nonLetters[144] = "Num Lock";
    nonLetters[145] = "Scroll Lock";
    nonLetters[186] = ":";
    nonLetters[187] = "=";
    nonLetters[188] = ",";
    nonLetters[189] = "-";
    nonLetters[190] = ".";
    nonLetters[191] = "|";
    nonLetters[192] = "~";
    nonLetters[219] = "(";
    nonLetters[220] = "/";
    nonLetters[221] = ")";
    nonLetters[222] = "'";


    // Characters
    for (var i = 0; i < 26; i++) {
        nonLetters[i + 0x41] = String.fromCharCode(i + 0x41);
    }

    // Space
    nonLetters[0x20] = "Space";

    // Numbers
    for (i = 0; i < 10; i++) {
        nonLetters[i + 0x30] = String.fromCharCode(i + 0x30);
    }

    return nonLetters;
};

InputManager.keyCodeToName = InputManager.generateKeyCodeToNameMapping();
// A small hack to shorten coding. Use Array.reduce to create an object that maps each key name to its keycode
function nameToCodeMapper(previous, current, index, array) {
    return previous.substring(0, previous.length - 1) + "\"" +
           array[index] + "\":" + index + ",}";
}
var json = InputManager.generateKeyCodeToNameMapping()
           .reduce(nameToCodeMapper, "{}")
           .replace(",}", "}");
InputManager.keyNameToCode = JSON.parse(json);

module.exports = InputManager;
