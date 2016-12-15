/* eslint-env node */
module.exports = function(grunt) {
    "use strict";

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        clean: {
            options: {},
            build: ["test/*.tap", "test/coverage"]
        },
        uglify: {
            options: {
                banner: "/*! <%= pkg.name %> v<%= pkg.version %> */\n",
                mangle: true,
                sourceMap: true
            },
            build: {
                src: "lib/<%= pkg.name %>.js",
                dest: "dist/<%= pkg.name %>.min.js"
            }
        },
        eslint: {
            console: {
                src: [
                    "Gruntfile.js",
                    "lib/**/*.js",
                    "test/*.js"
                ]
            },
            build: {
                options: {
                    outputFile: "eslint.xml",
                    format: "jslint-xml",
                    silent: true
                },
                src: [
                    "Gruntfile.js",
                    "lib/**/*.js",
                    "test/*.js"
                ]
            }
        },
        mochaTest: {
            test: {
                options: {
                    reporter: "tap",
                    captureFile: "test/mocha.tap"
                },
                src: [
                    "lib/breakup.js",
                    "test/test-breakup.js",
                    "test/test-breakup-caolan.js"
                    // NOTE: Not running test-breakup-jquery in NodeJS
                ]
            }
        },
        karma: {
            options: {
                singleRun: true,
                colors: true,
                configFile: "./karma.config.js",
                preprocessors: {
                    "./lib/*.js": ["coverage"]
                },
                basePath: "./",
                files: [
                    "test/vendor/mocha/mocha.css",
                    "test/vendor/mocha/mocha.js",
                    "test/vendor/expect/index.js",
                    "test/vendor/jquery/dist/jquery.js",
                    "lib/breakup.js",
                    "test/utils.js",
                    "test/test-*.js"
                ]
            },
            console: {
                browsers: ["PhantomJS"],
                frameworks: ["mocha"]
            }
        }
    });

    //
    // Plugins
    //
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("gruntify-eslint");
    grunt.loadNpmTasks("grunt-mocha-test");
    grunt.loadNpmTasks("grunt-karma");
    grunt.loadNpmTasks("grunt-contrib-clean");

    //
    // Tasks
    //
    grunt.registerTask("test", ["mochaTest", "karma:console"]);

    grunt.registerTask("lint", ["eslint:console"]);
    grunt.registerTask("lint:build", ["eslint:build"]);

    grunt.registerTask("build", ["uglify"]);

    //
    // Task Groups
    //
    grunt.registerTask("default", ["lint", "build"]);
    grunt.registerTask("travis", ["test", "lint"]);
    grunt.registerTask("all", ["clean", "test", "lint:build", "build"]);
};
