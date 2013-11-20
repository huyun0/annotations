module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshintProperties: grunt.file.readJSON('build/jshint.json'),

    currentTarget: "",

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'videoKIT.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },

    jshint: {
      all: '<%= currentTarget %>',
      options: '<%= jshintProperties %>'
    },

    watch: {
      options: {
        nospawn: true,
        livereload: false
      },

      // Watch Javascript file
      js: {
        files: ["js/**/*.js"],
        tasks: ['jshint', 'copy:local']
      },
      // Watch less file
      less: {
        files: ["style/**/*.less"],
        tasks: ['less:annotation', 'copy:local']
      }
    },

    less: {
      annotation: {
        options: {
          paths: ['style/bootstrap/css', 'style/annotations', 'style/timeline', 'style/bootstrap/less'],
          syncImport: true,
          strictImports: true,
          concat: true,
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
          src: '<%= currentTarget %>',
          dest: '/Users/xavierbutty/Sites/DEMO_ANNOT',
          filter: 'isFile'
        }]
      },
      'local-all': {
        files: [{
          flatten: false,
          expand: true,
          src: ['js/**/*', 'img/*', 'style/style.css', 'templates/*', 'resources/*', 'tests/**/*'],
          dest: 'www',
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
        tasks: ['watch:js', 'watch:less', 'connect'],
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
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-blanket-qunit');
  grunt.loadNpmTasks('assemble-less');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-connect');

  // Default task(s).
  grunt.registerTask('default', ['jshint:all', 'less-all', 'copy:local-all']);
  grunt.registerTask('dev', ['less:annotation', 'copy:local-all', 'copy:local-index', 'concurrent:dev']);

  // on watch events configure jshint:all to only run on changed file
  grunt.event.on('watch', function(action, filepath, target) {
    grunt.log.writeln(target + ': ' + filepath + ' has ' + action + " ------ ");

    grunt.config.set('currentTarget', [filepath]);


  });
};