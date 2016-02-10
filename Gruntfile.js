module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        bower: {
            dev: {
                dest: 'public/lib',
                options: {
                    expand: true,
                    keepExpandedHierarchy: false,
                    packageSpecific: {
                        bootstrap: {
                            files: [
                                'dist/css/bootstrap.css',
                                'dist/css/bootstrap.css.map',
                                'dist/css/bootstrap-theme.css',
                                'dist/css/bootstrap-theme.css.map',
                                'dist/js/bootstrap.js',
                                'dist/js/npm.js',
                                'dist/fonts/glyphicons-halflings-regular.eot',
                                'dist/fonts/glyphicons-halflings-regular.svg',
                                'dist/fonts/glyphicons-halflings-regular.ttf',
                                'dist/fonts/glyphicons-halflings-regular.woff',
                                'dist/fonts/glyphicons-halflings-regular.woff2',
                            ]
                        },
                        jquery: {
                            files: [ 'dist/jquery.js' ]
                        }
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-bower');

    grunt.registerTask('default', [ 'bower' ]);
}
