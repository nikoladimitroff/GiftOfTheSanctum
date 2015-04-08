var path = require("path");
var EOL = require('os').EOL;

var generatePreprocessor = function (platform, configuration) {
    var settings = {
        options: {
            context: {"else": "// @endif \n // @ifndef DEBUG"}
        },
        files: []
    };
    var context = settings.options.context;
    context["PLATFORM_" + platform.toUpperCase()] =
        context[configuration.toUpperCase()] = true;

    var src = {
        server: ["game/**/*.js", "utils/**/*.js", "server.js"],
        html5: ["game/**/*.js", "utils/**/*.js", "game_client/**/*.js"],
        wp8: ["**/*.js"],
    }[platform];

    var dest = {
        server: "distr/server/", // the server needs no extra processing
        html5: "build/html5/",
        wp8: "build/wp8/"
    }[platform];

    settings.files = [{
        expand: true, // Enable dynamic expansion.
        cwd: "src/", // Src matches are relative to this path.
        src: src, // Actual pattern(s) to match.
        dest: dest,  // Destination path prefix.
    }];

    return settings;
};

var generateBrowserify = function (platform, configuration) {
    var platformFiles = {
        html5: {
            src: ["build/html5/game_client/client.js"],
            dest: "distr/html5/main.js"
        },
        wp8: {
            src: ["build/html5/wp_client/client.js"],
            dest: "distr/wp8/main.js"
        }
    };
    var settings = {
        options: {
            browserifyOptions: {
                debug: configuration === "debug",
                verbose: configuration === "debug"
            }
        },
        files: [platformFiles[platform]]
    };
    return settings;
};


module.exports = function (grunt) {
    var settings = grunt.file.readJSON('local_grunt_settings.json');
    // Project configuration.
    grunt.initConfig({
        watch: {
            options: {
                interrupt: true,
                atBegin: true
            },
            html: {
                files: ["src/**/*.html", "index.html"],
                tasks: settings.htmlTasks,
            },
            css: {
                files: "src/**/style/*.less",
                tasks: settings.cssTasks,
            },
            js: {
                files: "src/**/*.js",
                tasks: settings.jsTasks,
            },
            content: {
                files: "content/**",
                tasks: settings.contentTasks
            }
        },
        preprocess: {
            "html5-debug": generatePreprocessor("html5", "debug"),
            "html5-release":generatePreprocessor("html5", "release"),
            "server-debug": generatePreprocessor("server", "debug"),
            "server-release":  generatePreprocessor("server", "release"),
            "wp8-debug": generatePreprocessor("wp8", "debug"),
            "wp8-release": generatePreprocessor("wp8", "release"),
        },
        jshint: {
            src: ["src/**/*.js", 'test/**/*.js'],
            options: {
                jshintrc: true
            }
        },
        jscs: {
            src: ["src/**/*.js", 'test/**/*.js'],
            options: {
                config: ".jscsrc"
            }
        },
        less: {
            options: {
                paths: ["src/**/style/*.less"]
            },
            html5: {
                files: {
                    "distr/html5/main.css": "src/game_client/style/main.less"
                }
            },
            wp8: {
                files: {
                    "distr/html5/main.css": "src/game_client/style/main.less"
                }
            },
        },
        browserify: {
            "html5-debug": generateBrowserify("html5", "debug"),
            "html5-release":generateBrowserify("html5", "release"),
            "wp8-debug": generateBrowserify("wp8", "debug"),
            "wp8-release": generateBrowserify("wp8", "release"),
        },
        concat: {
            options: {
                banner: grunt.file.read("src/game_client/index.html"),
                process: function(src, filepath) {
                    var viewName = path.basename(filepath, path.extname(filepath));
                    return EOL +
                           "<script type='text/html' id='" + viewName + "'>" +
                              src +
                           "</script>"
                },
            },
            html5: {
                files: [{
                    src: ["src/game_client/views/*.html"],
                    dest: "distr/html5/index.html"
                }],
            },
            wp8: {
                files: [{
                    src: ["src/game_client/views/*.html"],
                    dest: "distr/wp8/index.html"
                }],
            }
        },
        copy: {
            html5: {
                files: [
                    { expand: true, flatten: true, src: "src/**/cursors/*", dest: "distr/html5/cursors/" },
                    { expand: true, flatten: true, src: "src/**/fonts/*", dest: "distr/html5/fonts/" },
                    { expand: true, src: "3rdparty/**", dest: "distr/html5" },
                    { expand: true, src: "content/**", dest: "distr/html5" }
                ]
            },
            wp8: {
                files: [
                    { expand: true, flatten: true, src: "src/**/cursors/*", dest: "distr/wp8/cursors/" },
                    { expand: true, flatten: true, src: "src/**/fonts/*", dest: "distr/wp8/fonts/" },
                    { expand: true, src: "3rdparty/**", dest: "distr/wp8" },
                    { expand: true, src: "content/**", dest: "distr/wp8" }
                ]
            },
            server: {
                files: [{
                    expand: true,
                    src: "content/**",
                    dest: "distr/server" }
                ]
            }
        },
        mochaTest: {
            options: {
                reporter: "spec",
            },
            src: ["test/**/main.js"]
        },
        clean: {
            server: ["build/server/", "distr/server/"],
            html5: ["build/html5/", "distr/html5/"],
            wp8: ["build/wp8/", "distr/wp8/"],
        }
    });

    // Load the plugin that provides the "uglify" task.
    require('load-grunt-tasks')(grunt);

    // Default task(s).
    grunt.registerTask("check-code", ["jshint", "jscs"]);
    grunt.registerTask("test", ["mochaTest"]);

    grunt.registerTask("build", "Builds the entire game.", function (platform, configuration) {
        var validTargets = ["server", "html5", "wp8"];
        var validConfigurations = ["debug", "release"];
        if (validTargets.indexOf(platform) < 0 ||
            validConfigurations.indexOf(configuration) < 0) {
            grunt.fail.fatal("Invalid target or configuration!");
        }
        var fullTarget = platform + "-" + configuration;
        var clientTasks = [
            "jshint",
            "jscs",
            "mochaTest",
            "clean:" + platform,
            "copy:" + platform,
            "concat:" + platform,
            "preprocess:" + fullTarget,
            "browserify:" + fullTarget,
        ];
        var serverTasks = [
            "jshint",
            "jscs",
            "mochaTest",
            "clean:" + platform,
            "copy:" + platform,
            "preprocess:" + fullTarget,
        ];
        var tasks = platform === "server" ? serverTasks : clientTasks;
        grunt.task.run(tasks);
    });
};
