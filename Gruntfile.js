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

    jshint: {
      all: '<%= currentWatchFile %>',
      options: '<%= jshintProperties %>'
    },

    watch: {
      options: {
        nospawn: true
      },
      // Watch Javascript file
      js: {
        files: ["js/**/*.js", "templates/*.tmpl"],
        //tasks: ['jshint', 'copy:local']
        tasks: ['copy:local']
      },
      // Watch less file
      less: {
        files: ["style/**/*.less"],
        tasks: ['less:annotation', 'copy:style']
      },
      // Watch templates files
      templates: {
        files: ["templates/*.tmpl"],
        tasks: ['copy:local']
      },
      // Watch file on web server for live reload
      www: {
        options: {
          livereload: true,
          nospawn: true
        },
        files: ["www/**/*"]
      }
    },

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

    copy: {
      'local': {
        files: [{
          flatten: false,
          expand: true,
          src: '<%= currentWatchFile %>',
          dest: 'www',
          filter: 'isFile'
        }]
      },
      'local-all': {
        files: [{
          flatten: false,
          expand: true,
          src: ['js/**/*', 'img/**/*', 'style/**/*.png', 'style/**/*.css', 'templates/*', 'resources/*', 'tests/**/*'],
          dest: 'www',
        }]
      },
      'style': {
        files: [{
          flatten: false,
          expand: true,
          src: 'style/style.css',
          dest: 'www/',
          filter: 'isFile'
        }]
      },
      'local-index': {
        options: {
          processContent: function (content, srcpath) {
            return grunt.template.process(content);
          }
        },
        src: 'index.html',
        dest: 'www/index.html'
      }
    },

    concurrent: {
      dev: {
        tasks: ['watch:js', 'watch:less', 'watch:www', 'connect'],
        options: {
          logConcurrentOutput: true
        }
      }
    },

    connect: {
      server: {
        options: {
          port: 9001,
          base: 'www',
          keepalive: true,
          livereload: true
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
  grunt.loadNpmTasks('assemble-less');
  grunt.loadNpmTasks('grunt-concurrent');

  // Default task(s).
  grunt.registerTask('default', ['jshint:all', 'less-all', 'copy:local-all']);
  grunt.registerTask('dev', ['less:annotation', 'copy:local-all', 'copy:local-index', 'concurrent:dev']);

  // on watch events configure jshint:all to only run on changed file
  grunt.event.on('watch', function(action, filepath, target) {
    grunt.log.writeln(target + ': ' + filepath + ' has ' + action);

    if (target == "js") {
      var ext = filepath.split(".").pop();
      grunt.log.writeln("Extension: " + ext);

      switch (ext) {
        case "js": 
            grunt.task.run('jshint');
            break;
        case "tmpl":

            break;
      }
    }

    grunt.config.set('currentWatchFile', [filepath]);
  });
};