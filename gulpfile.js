'use strict';

const gulp         = require('gulp'),
      browserify   = require('browserify'),
      source       = require('vinyl-source-stream'),
      browserSync  = require('browser-sync').create();

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
    .require('./lib/dtmf', {expose: 'dtmf'})
    .require('./index',    {expose: 'goertzeljs'})
    .transform('babelify', {presets: ['es2015']})
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./demo'))
    .pipe(browserSync.stream());
});

gulp.task('default', ['demo']);

