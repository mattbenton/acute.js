var gulp = require("gulp");
var jshint = require("gulp-jshint");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var gzip = require("gulp-gzip");
var rename = require("gulp-rename");
var size = require("gulp-size");

var sources = [
  "src/helpers.js",
  "src/linkedlist.js",
  "src/app.js",
  "src/watcher.js",
  "src/parser.js",
  "src/scope.js",
  "src/directives.js",
  "src/filters.js",
  "src/core.js"
];

gulp.task("lint", function () {
  return gulp.src(sources)
    .pipe(jshint())
    .pipe(jshint.reporter("jshint-stylish"))
    .pipe(jshint.reporter("fail"));
});

gulp.task("build", ["lint"], function () {
  var build = sources.slice(0);
  build.unshift("src/build.prefix.js");
  build.push("src/build.suffix.js");

  return gulp.src(build)
    .pipe(jshint())
    .pipe(jshint.reporter("jshint-stylish"))
    .pipe(concat("acute.js"))
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest("build"))
    .pipe(uglify());
    // .pipe(rename("acute.min.js"))
    // .pipe(size({ showFiles: true }))
    // .pipe(gulp.dest("build"))
    // // .pipe(gzip())
    // // .pipe(size({ showFiles: true }))
    // // .pipe(gulp.dest("build"));
});

gulp.task("watch", function() {
  gulp.watch("src/*.js", ["build"]);
});

gulp.task("default", ["build"]);
