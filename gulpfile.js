var gulp       = require("gulp");
var jshint     = require("gulp-jshint");
var browserify = require("gulp-browserify");
var concat     = require("gulp-concat");
var uglify     = require("gulp-uglify");
var gzip       = require("gulp-gzip");
var rename     = require("gulp-rename");
var size       = require("gulp-size");
var docco      = require("gulp-docco");
var mocha      = require("gulp-mocha");
var notify     = require("gulp-notify");

gulp.task("lint", function () {
  return gulp.src("src/**/*.js")
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
});

gulp.task("test", function () {
  gulp.src("src/boot.js", { read: false })
    .pipe(browserify())
    .pipe(mocha());
});

gulp.task("build", ["lint"], function () {
  gulp.src("src/boot.js", { read: false })
    .pipe(browserify())
    .pipe(size())
    .pipe(rename("acute.js"))
    .pipe(gulp.dest("build"))
    // .pipe(gulp.dest("/Users/matt/work/fanplayr/repos/client-runtime/src/acute"))
    // .pipe(gulp.dest("/Users/matt/work/fanplayr/repos/cr/src/platform/vendor"))
    // .pipe(gulp.dest("/Users/matt/work/fanplayr/repos/cr/new/src/services/offers-legacy/vendor"))
    .pipe(gulp.dest("/Users/matt/work/fanplayr/repos/client/src/services/offers-legacy/vendor"))
    .pipe(gulp.dest("/Users/matt/work/fanplayr/repos/client/src/services/intent/vendor"))
    .pipe(notify("Built: <%= file.relative %>"));
});

gulp.task("package", ["build"], function () {
  gulp.src("src/boot.js", { read: false })
    .pipe(browserify())
    .pipe(uglify())
    .pipe(rename("acute.min.js"))
    .pipe(size())
    .pipe(gulp.dest("build"))
    .pipe(gzip())
    .pipe(size())
    .pipe(gulp.dest("build"))
    .pipe(notify("Built: <%= file.relative %>"));
})

gulp.task("watch", function() {
  gulp.watch("src/**/*.js", ["build"]);
});

gulp.task("default", ["build"]);
