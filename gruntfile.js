module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        //express starts a server
        //https://github.com/blai/grunt-express
        express: {
            all: {
                options: {
                    bases: ['.'],
                    port: 8080,
                    hostname: "127.0.0.1",
                    livereload: true
                }
            }
        },
        //open opens the browser
        // https://www.npmjs.org/package/grunt-open
        open: {
            all: {
                path: 'http://127.0.0.1:8080/index.html'
            }
        },

        jshint: {
            options: {
                reporter: require('jshint-stylish')
            },
            all: ['main.js']
        },

        //watch watches for files and enables live reload
        watch: {
            all: {
                files: ['*.js', '*.html'],
                options: {
                    livereload: true
                }
            }
        },

        'ftp-deploy': {
            build: {
                auth: {
                    host: "s189165.gridserver.com",
                    port: 21,
                    authKey: "key1"
                },
                src: '.',
                dest: '/scottpham/quake-ractive',
                exclusions: ['.gitignore', '.ftppass', 'gruntfile.js', 'node_modules', 'readme.md', 'package.json', 'divshot.json', '.divshot-cache', '.git']
            }
        }
    });

    //register default
    grunt.registerTask('default', [
        'open',
        'express',
        'watch'
    ]);




    //enable tasks
    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-express');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-ftp-deploy');

};
