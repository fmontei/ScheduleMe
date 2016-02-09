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
                            files: [ 'dist/css/*', 'dist/js/*', 'dist/fonts/*' ],
                            dest: 'public/lib/bootstrap',
                            css_dest: 'public/lib/bootstrap/css',
                            map_dest: 'public/lib/bootstrap/css',
                            js_dest: 'public/lib/bootstrap/js',
                            fonts_dest: 'public/lib/bootstrap/fonts'
                        },
                        jquery: {
                            stripGlobBase: true,
                            files: [ 'dist/*' ],
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
