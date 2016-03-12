var gulp = require('gulp');
var coffee = require('gulp-coffee');
var jasmine = require('gulp-jasmine');
var gutil = require('gulp-util');


gulp.task('coffee-src', function() {
  return gulp.src('./src/*.coffee')
    .pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(gulp.dest('./build/'));
});

gulp.task('coffee-spec', function() {
  return gulp.src('./spec/*.coffee')
    .pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(gulp.dest('./spec/'));
});

gulp.task('test', ['build'], function() {
  return gulp.src('./spec/*.js')
		.pipe(jasmine())
});

gulp.task('build', ['coffee-src', 'coffee-spec']);
gulp.task('default', ['test']);