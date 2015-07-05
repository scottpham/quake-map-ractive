module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

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
        // https://www.npmjs.org/package/grunt-open
        open: {
            all: {
                path: 'http://127.0.0.1:8080/index.html'
            }
        },
    
        watch: {
            all: {
                files: ['*.js', '*.html'],
                options: {
                    livereload: true
                }
            }
        }
    });

    grunt.registerTask('default', [
        'open',
        'express',
        'watch'
        
    ]);

    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-express');
    
};
