module.exports = function ( grunt ) {
  grunt.initConfig({
    uglify: {
      js: {
        files: {
          "acute.min.js": ["acute.js"]
        }
      }
    },
    bytesize: {
      all: {
        src: [
          "acute.js",
          "acute.min.js"
        ]
      }
    }
  });

  grunt.registerTask("default", ["uglify", "bytesize"]);

  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-bytesize");
};
