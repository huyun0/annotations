module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        /** JSHint properties */
        jshintProperties: grunt.file.readJSON('build/jshint.json'),

        /** The current target file for the watch tasks */
        currentWatchFile: "",

        /** Local directory for the tests */
        localDir: "www",

        /** Directory for the integration of the tool */
        integrationDir: "/Users/xavierbutty/Documents/Projects/Entwine/Matterhorn/lib/local/entwine-annotations-tool-1.5-SNAPSHOT/ui",

        /** Paths for the different types of ressource */
        srcPath: {
            js: "js/**/*.js",
            less: "style/**/*.less",
            tmpl: "templates/*.tmpl",
            www: "<%= localDir %>/**/*"
        },

        profiles: {
            integration: {
                sources : "",
                target  : "/Users/xavierbutty/Documents/Projects/Entwine/Matterhorn/lib/local/entwine-annotations-tool-1.5-SNAPSHOT/ui",
                config  : "build/profiles/integration/annotations-tool-configuration.js"
            },
            local: {
                sources: "<source src=\"resources/aav1.mp4\" type=\"video/mp4\" />\n \
                          <source src=\"resources/aav1.webm\" type=\"video/webm\" />\n \
                          <source src=\"resources/aav1.ogv\" type=\"video/ogg\" /> ",
                target : "www",
                config : "js/annotations-tool-configuration.js"
            }
        },

        currentProfile: undefined,

        jshint: {
            all: '<%= currentWatchFile %>',
            options: '<%= jshintProperties %>'
        },

        /** Task to watch src files and process them */
        watch: {
            options: {
                nospawn: true
            },
            // Watch Javascript file
            js: {
                files: ["<%= srcPath.js %>", "<%= srcPath.tmpl %>"],
                tasks: ['copy:local']
            },
            // Watch less file
            less: {
                files: ["<%= srcPath.less %>"],
                tasks: ['less:annotation', 'copy:style']
            },
            // Watch file on web server for live reload
            www: {
                options: {
                    livereload: true,
                    nospawn: true
                },
                files: ["<%= srcPath.www %>"]
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
                    "js/Templates.js": "<%= srcPath.tmpl %>"
                }
            }
        },

        /** Copy .. */
        copy: {
            // ... a single file locally
            'local': {
                files: [{
                    flatten: false,
                    expand: true,
                    src: '<%= currentWatchFile %>',
                    dest: '<%= localDir %>',
                    filter: 'isFile'
                }]
            },
            // ... all the tool files locally
            'local-all': {
                files: [{
                    flatten: false,
                    expand: true,
                    src: ['js/**/*', 'img/**/*', 'style/**/*.png', 'style/**/*.css', 'templates/*', 'resources/*', 'tests/**/*'],
                    dest: '<%= localDir %>',
                }]
            },
            // ... the index locally 
            'local-index': {
                options: {
                    processContent: function(content, srcpath) {
                        return grunt.template.process(content);
                    }
                },
                src: 'index.html',
                dest: '<%= localDir %>/index.html'
            },
            // ... the stylesheet locally
            'style': {
                files: [{
                    src: 'style/style.css',
                    dest: '<%= currentProfile.target %>/'
                }]
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
                    processContent: function(content, srcpath) {
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

        /** Task to run tasks in parrallel */
        concurrent: {
            dev: {
                tasks: ['watch:js', 'watch:less', 'watch:www', 'connect'],
                options: {
                    logConcurrentOutput: true
                }
            }
        },

        /** Web server */
        connect: {
            server: {
                options: {
                    port: 9001,
                    base: '<%= localDir %>',
                    keepalive: true,
                    livereload: true
                }
            }
        },

        /** Optimisation through requireJS */
        requirejs: {
            compile: {
                options: {
                    baseUrl: './js',
                    name: "annotations",
                    mainConfigFile: "./js/libs/require/config/config.js",
                    name: "main",
                    optimizeAllPluginResources: false,
                    preserveLicenseComments: false,
                    optimize: "uglify",
                    useStrict: true,
                    out: "optimized.js"
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

    // Default task(s).
    grunt.registerTask('default', ['jshint:all', 'less-all', 'copy:local-all', 'copy:local-index']);
    grunt.registerTask('baseDev', ['less:annotation', 'copy:all', 'copy:index', 'copy:config', 'concurrent:dev']);

    grunt.registerTask('dev', "Develop task", function (profile) {
        grunt.log.writeln("Develop task with profile '" + profile + "' started!");
        grunt.config.set('currentProfile', grunt.config.get('profiles.' + profile));
        grunt.task.run('baseDev');
    });

    // on watch events configure jshint:all to only run on changed file
    grunt.event.on('watch', function(action, filepath, target) {
        grunt.log.writeln(target + ': ' + filepath + ' has ' + action);

        if (target == "js") {
            var ext = filepath.split(".").pop();

            switch (ext) {
                case "js":
                    grunt.config.set('currentWatchFile', [filepath]);
                    grunt.task.run('jshint');
                    break;
                case "tmpl":
                    grunt.config.set('currentWatchFile', [filepath]);
                    //grunt.config.set('currentWatchFile', ["js/Templates.js"]);
                    grunt.task.run('handlebars');
                    break;
                default:
                    grunt.config.set('currentWatchFile', [filepath]);
                    break;
            }
        }
    });
};