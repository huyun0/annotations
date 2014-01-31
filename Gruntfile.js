module.exports = function (grunt) {

    /** ================================================
     *  Project configuration
     ==================================================*/
    grunt.initConfig({
        /** Load informations from package.json */
        pkg: grunt.file.readJSON('package.json'),

        /** JSHint properties */
        jshintProperties: grunt.file.readJSON('build/jshint.json'),

        /** The current target file for the watch tasks */
        currentWatchFile: '',

        /** Local directory for the tests */
        webServerDir: 'www',

        /** Paths for the different types of ressource */
        srcPath: {
            js      : 'js/**/*.js',
            test_js : 'tests/js/**/*.js',
            less    : 'style/**/*.less',
            html    : '**/*.html',
            tmpl    : 'templates/*.tmpl',
            tests   : 'tests/',
            www     : '<%= webServerDir %>/**/*'
        },

        profiles: {

            // Default profile if no one is given
            default: 'local',
             
            integration: {
                sources : '',
                target  : '../Matterhorn/lib/local/entwine-annotations-tool-1.5-SNAPSHOT/ui',
                config  : 'build/profiles/integration/annotations-tool-configuration.js'
            },

            local: {
                sources: '<source src=\"resources/aav1.mp4\" type=\"video/mp4\" />\n \
                          <source src=\"resources/aav1.webm\" type=\"video/webm\" />\n \
                          <source src=\"resources/aav1.ogv\" type=\"video/ogg\" /> ',
                target : 'www',
                config : 'js/annotations-tool-configuration.js'
            }
        },

        currentProfile: undefined,

        jshint: {
            all     : '<%= currentWatchFile %>',
            options : '<%= jshintProperties %>'
        },

        /** Task to watch src files and process them */
        watch: {
            options: {
                nospawn: true
            },
            // Watch Javascript files
            js: {
                files: ['<%= srcPath.js %>', '<%= srcPath.test_js %>'],
                tasks: ['jshint:all', 'copy:target']
            },
            // Watch Templates files
            handlebars: {
                files: ['<%= srcPath.tmpl %>'],
                tasks: ['copy:target']
            },
            // Watch HTML files
            html: {
                files: ['<%= srcPath.html %>'],
                tasks: ['copy:index']
            },
            // Watch LESS files
            less: {
                files: ['<%= srcPath.less %>'],
                tasks: ['less:annotation', 'copy:style']
            },
            // Watch the LESS, Javascript, Templates and HTML at the same times
            // Use it for single core processor. It could stop working with an important number of files
            multiple: {
                files: ['<%= srcPath.less %>', '<%= srcPath.js %>', '<%= srcPath.html %>', '<%= srcPath.tmpl %>'],
                tasks: ['copy:target']
            },
            // Watch file on web server for live reload
            www: {
                options: {
                    livereload: true,
                    nospawn: true
                },
                files: ['<%= srcPath.www %>']
            }
        },

        /** Compile the less files into a CSS file */
        less: {
            annotation: {
                options: {
                    paths: ['style/bootstrap/css', 'style/annotations', 'style/timeline', 'style/bootstrap/less'],
                    syncImport: true,
                    strictImports: true,
                    concat: true,
                    compress: true,
                    imports: {
                        less: ['style/bootstrap/less/mixins.less', 'style/bootstrap/variables.less']
                    }
                },
                files: {
                    "style/style.css": "style/style.less"
                }
            }
        },

        /** Pre-compile the handlebars templates */
        handlebars: {
            compile: {
                options: {
                    amd: true
                },
                files: {
                    'js/Templates.js': '<%= srcPath.tmpl %>'
                }
            }
        },

        /** Copy .. */
        copy: {
            // ... a single file locally
            'target': {
                files: [{
                    flatten : false,
                    expand  : true,
                    src     : '<%= currentWatchFile %>',
                    dest    : '<%= currentProfile.target %>',
                    filter  : 'isFile'
                }]
            },
            // ... all the tool files locally
            'local-all': {
                files: [{
                    flatten : false,
                    expand  : true,
                    src     : ['js/**/*', 'img/**/*', 'style/**/*.png', 'style/**/*.css', 'templates/*', 'resources/*', 'tests/**/*'],
                    dest    : '<%= webServerDir %>',
                }]
            },
            // ... the stylesheet locally
            'style': {
                files: [{
                    src  : 'style/style.css',
                    dest : '<%= currentProfile.target %>/style/style.css'
                }]
            },
            // ... the index locally 
            'local-index': {
                options: {
                    processContent: function (content) {
                        return grunt.template.process(content);
                    }
                },
                src: 'index.html',
                dest: '<%= webServerDir %>/index.html'
            },
            // ... all the tool files for the current profile
            'all': {
                files: [{
                    flatten: false,
                    expand: true,
                    src: ['js/**/*', 'img/**/*', 'style/**/*.png', 'style/**/*.css', 'templates/*', 'resources/*', 'tests/**/*'],
                    dest: '<%= currentProfile.target %>',
                }]
            },
            // ... the index locally 
            'index': {
                options: {
                    processContent: function (content) {
                        return grunt.template.process(content);
                    }
                },
                src: 'index.html',
                dest: '<%= currentProfile.target %>/index.html'
            },
            // ... the configuration 
            'config': {
                src: '<%= currentProfile.config %>',
                dest: '<%= currentProfile.target %>/js/annotations-tool-configuration.js'
            }
        },

        blanket_qunit: {
            all: {
                options: {
                    urls: [
                        '<%= srcPath.tests %>loop.html?coverage=true&gruntReport',
                        '<%= srcPath.tests %>collections.html?coverage=true&gruntReport',
                        '<%= srcPath.tests %>models.html?coverage=true&gruntReport'
                    ],
                    threshold: 10,
                    globalThreshold: 10
                }
            }
        },


        /** Task to run tasks in parrallel */
        concurrent: {
            dev: {
                tasks: ['watch:js', 'watch:html', 'watch:less', 'watch:www', 'connect'],
                options: {
                    logConcurrentOutput: true,
                    limit: 5
                }
            }
        },

        /** Web server */
        connect: {
            server: {
                options: {
                    port: 9001,
                    base: '<%= webServerDir %>',
                    keepalive: true,
                    livereload: true
                }
            }
        },

        /** Optimisation through requireJS */
        requirejs: {
            compile: {
                options: {
                    baseUrl                    : './js',
                    name                       : 'annotations',
                    mainConfigFile             : './js/libs/require/config/config.js',
                    name                       : 'main',
                    optimizeAllPluginResources : false,
                    preserveLicenseComments    : false,
                    optimize                   : 'uglify',
                    useStrict                  : true,
                    out                        : 'optimized.js'
                }
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-blanket-qunit');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-handlebars');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('assemble-less');
    grunt.loadNpmTasks('grunt-concurrent');


    /** ================================================
     *  Register custom tasks
     ==================================================*/

    // Default task
    grunt.registerTask('default', ['jshint:all', 'less-all', 'copy:local-all', 'copy:local-index']);
    grunt.registerTask('baseDev', ['less:annotation', 'copy:all', 'copy:index', 'copy:config', 'concurrent:dev']);

    // Development workflow with profiles (grunt dev [--profile=PROFILE_NAME])
    grunt.registerTask('dev', 'Development workflow', function () {

        var profileName = grunt.option('profile'),
            profileConfig;

        // If no profile name given, use the default one
        if (typeof profileName == 'undefined') {
            profileName = grunt.config.get('profiles.default');
            grunt.option('profile', profileName);
            grunt.log.writeln('No profile name given as option, use default one.');
        }

        // Get the profile configuration
        profileConfig = grunt.config.get('profiles.' + profileName);

        // Check if the profile exist
        if (typeof profileConfig == 'undefined') {
            grunt.fail.fatal('The profile "' + profileName + '" does not exist in the Gruntfile.');
        }

        grunt.log.writeln('Develop task with profile "' + profileName + '" started! ');

        // Configure the tasks with given profiles
        grunt.config.set('currentProfile', profileConfig);

        // Run the tasks
        grunt.task.run('baseDev'); 
    });

    /** ================================================
     *  Listerers 
     ==================================================*/

    // on watch events configure jshint:all to only run on changed file
    grunt.event.on('watch', function (action, filepath, target) {

        // Set the current file processed for the different tasks
        grunt.config.set('currentWatchFile', [filepath]);

        // Configure the tasks with given profiles
        grunt.config.set('currentProfile', grunt.config.get('profiles.' + grunt.option('profile')));

        if (target == 'multiple') {
            // If the watch target is multiple, 
            // we manage the tasks to run following the touched file extension
            var ext = filepath.split('.').pop();

            switch (ext) {
                case 'js':
                    grunt.task.run('jshint');
                    grunt.task.run('blanket_qunit');
                    break;
                case 'tmpl':
                    grunt.task.run('handlebars');
                    break;
                case 'less':
                    grunt.task.run('less:annotation');
                    grunt.task.run('copy:style');
                    break;
            }
        }
    });
};