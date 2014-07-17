/* global module:false, require:false */
var path = require('path');

var folderMount = function folderMount(connect, point) {
  return connect.static(path.resolve(point));
};

module.exports = function(grunt) {
  function registerRobustTasks(name, tasks) {
    grunt.registerTask(name, function() {
      // so we don't have stupid issues with grunt crashing
      // every time a test fails...
      grunt.option('force', true);
      grunt.task.run(tasks);
    });
  }

  grunt.initConfig({
    pkg : grunt.file.readJSON('package.json'),
    connect : {
      server : {
        options : {
          base : '.',
          port : 4949,
          hostname : '*',
          livereload : 4948
        }
      }
    },
    stylus : {
      dev : {
        options : {
          // maybe later?
        },
        files : {
          'css/style.css' : 'stylus/style.styl'
        }
      }
    },
    jshint : {
      options : {
      },
      code : ['js/**/*.js', '!deps/**/*.js'],
      all : ['js/**/*.js', '!js/deps/**/*.js']
    },
    watch : {
      js : {
        files : ['js/**/*.js',],
        tasks : ['jshint:all'],
        options : {
          livereload : 4948
        }
      },
      stylus : {
        files : ['stylus/**/*.styl'],
        tasks : ['stylus:dev'],
        options : {
          livereload : 4948
        }
      },
      html : {
        files : ['./**/*.html'],
        options : {
          livereload : 4948
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-stylus');

  registerRobustTasks('default', ['connect', 'watch']);
};
