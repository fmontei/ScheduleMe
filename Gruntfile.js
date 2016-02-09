module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        bower: {
            dev: {
                dest: 'public/lib',
                options: {
                    packageSpecific: {
                        bootstrap: {
                            stripGlobBase: true,
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
                            ],
                            dest: 'public/lib/bootstrap',
                            css_dest: 'public/lib/bootstrap/css',
                            map_dest: 'public/lib/bootstrap/css',
                            js_dest: 'public/lib/bootstrap/js',
                            fonts_dest: 'public/lib/bootstrap/fonts'
                        },
                        jquery: {
                            stripGlobBase: true,
                            files: [ 'dist/jquery.js' ],
                            dest: 'public/lib/jquery'
                        },
                        angular: {
                            dest: 'public/lib/angular'
                        }
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-bower');

    grunt.registerTask('default', [ 'bower' ]);
};
