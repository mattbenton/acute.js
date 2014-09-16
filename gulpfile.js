var gulp = require("gulp");
var jshint = require("gulp-jshint");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var gzip = require("gulp-gzip");
var rename = require("gulp-rename");
var size = require("gulp-size");
var docco = require("gulp-docco");
var mox = require("gulp-mox");
var notify = require("gulp-notify");

var sources = [
  "src/log.js",
  "src/helpers.js",
  "src/linkedlist.js",
  "src/observer.js",
  "src/scope.js",
  "src/view.js",
  "src/parser.js",
  "src/core.js",
  "src/directives.js",
  "src/directives/*.js",
  "src/polyfills.js"
];

gulp.task("lint", function () {
  return gulp.src(sources)
    .pipe(jshint())
    .pipe(jshint.reporter("jshint-stylish"))
    .pipe(notify(function ( file ) {
      if ( file.jshint.success ) {
        // Don't show something if success
        return false;
      }

      var errors = file.jshint.results.map(function (data) {
        if (data.error) {
          return "(" + data.error.line + ':' + data.error.character + ') ' + data.error.reason;
        }
      }).join("\n");
      return file.relative + " (" + file.jshint.results.length + " errors)\n" + errors;
    }));
    // .pipe(jshint.reporter("fail"));
});

gulp.task("docs", function () {
  return gulp.src(sources)
    .pipe(mox({
      htmlFile: "docs/html"
    }))
    .pipe(gulp.dest("docs"));
});

gulp.task("build", ["lint"], function () {
  // Copy source array
  var build = sources.slice(0);
  build.unshift("src/build.prefix.js");
  build.push("src/build.suffix.js");

  return gulp.src(build)
    .pipe(concat("acute.js"))
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest("build"))
    .pipe(notify("Built: <%= file.relative %>"))

    // .pipe(uglify())
    // .pipe(rename("acute.min.js"))
    // .pipe(size({ showFiles: true }))
    // .pipe(gulp.dest("build"))
    // .pipe(gzip())
    // .pipe(size({ showFiles: true }))
    // .pipe(gulp.dest("build"))
    // .pipe(notify("Built: <%= file.relative %>"));
});

gulp.task("watch", function() {
  gulp.watch("src/**/*.js", ["build"]);
});

gulp.task("default", ["build"]);
