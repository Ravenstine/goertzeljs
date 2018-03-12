'use strict';

const gulp         = require('gulp'),
      browserify   = require('browserify'),
      source       = require('vinyl-source-stream'),
      babel        = require('babelify'),
      gutil        = require('gulp-util'),
      jasmine      = require('gulp-jasmine'),
      browserSync  = require('browser-sync').create();

gulp.task('test', () => {
  return gulp.src('./spec/*.js')
		.pipe(jasmine())
});

gulp.task('benchmark', ['build'], () =>{
  return gulp.src('./benchmark/*.coffee')
    .pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(browserify())
    .pipe(gulp.dest('./benchmark/'));
})

gulp.task('demo', ['build:demo'], () => {
  browserSync.init({
    server: "./demo"
  });
  gulp.watch('./src/*.js', ['build:demo']);
  gulp.watch('./demo/index.html').on('change', browserSync.reload);
  gulp.watch('./demo/demo.js').on('change', browserSync.reload);
})

gulp.task('build:demo', () => {
  return browserify({debug: true, extensions: ['.js']})
    .require('./src/dtmf', {expose: 'dtmf'})
    .require('./src/goertzel', {expose: 'goertzeljs'})
    .transform('babelify', {presets: ['es2015']})
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./demo'))
    .pipe(browserSync.stream());
});

gulp.task('default', ['test']);