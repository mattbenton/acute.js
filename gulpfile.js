var gulp       = require("gulp");
var jshint     = require("gulp-jshint");
var browserify = require("gulp-browserify");
var concat     = require("gulp-concat");
var uglify     = require("gulp-uglify");
var gzip       = require("gulp-gzip");
var rename     = require("gulp-rename");
var size       = require("gulp-size");
var docco      = require("gulp-docco");
var lazypipe   = require("lazypipe");
var wrapper    = require("gulp-wrapper");
var notify     = require("gulp-notify");

var wrap = lazypipe()
  .pipe(wrapper, {
     header: "(function () { var acute, $, _; \n",
     footer: "\n}());"
  });

gulp.task("build", function () {
  gulp.src("src/acute.js", { read: false })
    .pipe(browserify())
    .pipe(size())
    .pipe(wrap())
    .pipe(gulp.dest("build"))
    .pipe(gulp.dest("/Users/matt/work/fanplayr/repos/client-runtime/src/acute"))
    .pipe(notify("Built: <%= file.relative %>"));
});

gulp.task("package", function () {
  gulp.src("src/acute.js", { read: false })
    .pipe(browserify())
    .pipe(wrap())
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
