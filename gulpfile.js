var gulp = require('gulp');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var watch = require('gulp-watch');
var browserSync = require('browser-sync').create();
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

var paths = {
    node_server: 'node-server/',
};

gulp.task('js', ['templates'], function() {
    var all_files = [
        // paths.something + 'something.js',
        // paths.something + 'js/src/**/*.js',
    ];
    
    return gulp.src(all_files)
        .pipe(concat('dest.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(paths.something + 'js/'));
});

gulp.task('watch', function() {
    // gulp.watch('js/src/**/*.js', ['js']);
    gulp.watch(paths.node_server + "*.scss", ['sass']);
});

gulp.task('default', ['watch', 'sass', 'browser-sync']);

gulp.task('build', ['sass']);

gulp.task('browser-sync', function() {
    browserSync.init({
        proxy: "http://127.0.0.1:3000/",
        open: false,
        port: 3500,
    });
});
gulp.task('sass', function() {
    gulp.src(paths.node_server + 'hangman.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(paths.node_server + 'public/css/'))
        .pipe(browserSync.stream({match: '**/*.css'}));
});
