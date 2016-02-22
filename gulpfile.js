var gulp = require('gulp'),
    $ = require('gulp-load-plugins')();

gulp.task('lint', function () {
  return gulp.src([
      './src/*.js',
      'bin/alm'
    ])
    .pipe($.jshint())
    .pipe($.jshint.reporter('default', { verbose: true }));
});

gulp.task('default', ['lint']);
