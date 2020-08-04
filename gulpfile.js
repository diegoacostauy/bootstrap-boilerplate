'use strict';

const gulp = require('gulp'),
  sass = require('gulp-sass'),
  del = require('del'),
  browserify = require('browserify'),
  babelify = require('babelify'),
  source = require('vinyl-source-stream'),
  buffer = require('vinyl-buffer'),
  uglify = require('gulp-uglify'),
  cleanCSS = require('gulp-clean-css'),
  rename = require('gulp-rename'),
  merge = require('merge-stream'),
  htmlreplace = require('gulp-html-replace'),
  fileinclude = require('gulp-file-include'),
  htmlmin = require('gulp-htmlmin'),
  autoprefixer = require('gulp-autoprefixer'),
  sourcemaps = require('gulp-sourcemaps'),
  browserSync = require('browser-sync').create();

// Clean task
gulp.task('clean', function(cb) {
  del(['dev', 'dist', 'assets/css/app.css']);
  cb();
});


// Copy third party libraries from node_modules into /vendor
gulp.task('vendor:js', function() {
  return gulp.src([
    './node_modules/bootstrap/dist/js/*',
    './node_modules/jquery/dist/*',
    '!./node_modules/jquery/dist/core.js',
    './node_modules/popper.js/dist/umd/popper.*'
  ])
    .pipe(gulp.dest('./assets/js/vendor'));
});

// Copy font-awesome from node_modules into /fonts
gulp.task('vendor:fonts', function() {
  return  gulp.src([
    './node_modules/font-awesome/**/*',
    '!./node_modules/font-awesome/{less,less/*}',
    '!./node_modules/font-awesome/{scss,scss/*}',
    '!./node_modules/font-awesome/.*',
    '!./node_modules/font-awesome/*.{txt,json,md}'
  ])
    .pipe(gulp.dest('./assets/fonts/font-awesome'))
});

// vendor task
gulp.task('vendor', gulp.parallel('vendor:fonts', 'vendor:js'));

// Copy Bootstrap SCSS(SASS) from node_modules to /assets/scss/bootstrap
gulp.task('bootstrap:scss', function() {
  return gulp.src(['./node_modules/bootstrap/scss/**/*'])
    .pipe(gulp.dest('./assets/scss/bootstrap'));
});

gulp.task('scss:grid', function compileScss() {
  return gulp.src(['./assets/scss/bootstrap/bootstrap-grid.scss'])
    .pipe(sass.sync({
      outputStyle: 'expanded'
    }).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(gulp.dest('./assets/css/bootstrap-grid.css'))
});


// Compile SCSS(SASS) files
gulp.task('scss', gulp.series('bootstrap:scss', function compileScss() {
  return gulp.src(['./assets/scss/*.scss'])
    .pipe(sourcemaps.init())
    .pipe(sass.sync({
      outputStyle: 'expanded'
    }).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write('./dev/assets/css/maps'))
    .pipe(gulp.dest('./assets/css'))
}));


// DEV TASKS
// Copy vendor's js to /dev
gulp.task('vendor:dev', function() {
  var jsStream = gulp.src([
    './assets/js/vendor/bootstrap.min.js',
    './assets/js/vendor/jquery.slim.min.js',
    './assets/js/vendor/popper.min.js'
  ])
    .pipe(gulp.dest('./dev/assets/js/vendor'));
  var fontStream = gulp.src(['./assets/fonts/font-awesome/**/*.*']).pipe(gulp.dest('./dev/assets/fonts/font-awesome'));
  return merge (jsStream, fontStream);
})

// Css dev
gulp.task('css:dev', gulp.series('scss', function cssMinify() {
  return gulp.src('./assets/css/app.css')
    .pipe(gulp.dest('./dev/assets/css'))
    .pipe(browserSync.stream());
}));

// Js dev
gulp.task('js:dev', function () {
  return browserify({
    entries: ['./assets/js/index.js']
  })
  .transform(babelify,{presets: ['@babel/preset-env']})
  .bundle()
  .pipe(source('index.js'))
  .pipe(buffer())
  .pipe(rename('app.min.js'))
  .pipe(sourcemaps.init({ loadMaps: true }))
  .pipe(sourcemaps.write('./dev/assets/js/maps'))
  .pipe(gulp.dest('./dev/assets/js'))
  .pipe(browserSync.stream())
});

gulp.task('html:dev', () => {
  return gulp.src('*.html')
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file',
      indent: true
    }))
    .pipe(gulp.dest('./dev'));
});

gulp.task('fileinclude:dev', function(callback) {
  return gulp
    .src('*.html')
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file',
      indent: true
    }))
    .pipe(gulp.dest('./dev'));
});
// DEV TASKS



// BUILD TASKS
// Minify CSS
gulp.task('css:build', gulp.series('scss', function cssMinify() {
  return gulp.src('./assets/css/app.css')
    .pipe(cleanCSS())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('./dist/assets/css'))
    .pipe(browserSync.stream());
}));

// Minify Js
gulp.task('js:build', function () {
  return browserify({
    entries: ['./assets/js/index.js']
  })
  .transform(babelify,{presets: ['@babel/preset-env']})
  .bundle()
  .pipe(source('index.js'))
  .pipe(buffer())
  .pipe(rename('app.min.js'))
  .pipe(sourcemaps.init({ loadMaps: true }))
  .pipe(uglify())
  .pipe(sourcemaps.write('./'))
  .pipe(gulp.dest('./dist/assets/js'))
  .pipe(browserSync.stream())
});

// Copy vendor's js to /dist
gulp.task('vendor:build', function() {
  var jsStream = gulp.src([
    './assets/js/vendor/bootstrap.min.js',
    './assets/js/vendor/jquery.slim.min.js',
    './assets/js/vendor/popper.min.js'
  ])
    .pipe(gulp.dest('./dist/assets/js/vendor'));
  var fontStream = gulp.src(['./assets/fonts/font-awesome/**/*.*']).pipe(gulp.dest('./dist/assets/fonts/font-awesome'));
  return merge (jsStream, fontStream);
})

gulp.task('html:build', () => {
  return gulp.src('*.html')
    .pipe(htmlreplace({
      'js': 'assets/js/app.min.js',
      'css': 'assets/css/app.min.css'
    }))
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file',
      indent: true
    }))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest('dist'));
});

// BUILD TASKS

gulp.task('browsersync', function(callback) {
  browserSync.init({
    server: {
      baseDir: ['./dev', './']
    },
  });
  callback();
});

gulp.task('browsersyncReload', function(callback) {
  browserSync.reload();
  callback();
});

// Configure the browserSync task and watch file path for change
gulp.task('watch', function browserDev(done) {
  gulp.watch(['./assets/scss/**/*.scss','!assets/scss/bootstrap/**'], gulp.series('css:dev','browsersyncReload'));
  gulp.watch('./assets/js/**/.js', gulp.series('js:dev','browsersyncReload'));
  gulp.watch(['*.html', 'partials/*.html'], gulp.series('html:dev', 'browsersyncReload'));
});

// Dev task live reload
gulp.task('dev:build', gulp.series(gulp.parallel('css:dev', 'js:dev', 'vendor'), 'vendor:dev', function copyAssetsDev() {
  return gulp.src([
    '*.html',
    // 'favicon.ico',
    'assets/img/**'
  ], { base: './'})
    .pipe(gulp.dest('dev'));
}));

// Build task
gulp.task('prod:build', gulp.series(gulp.parallel('css:build', 'js:build', 'vendor'), 'vendor:build', function copyAssets() {
  return gulp.src([
    '*.html',
    // 'favicon.ico',
    'assets/img/**'
  ], { base: './'})
    .pipe(gulp.dest('dist'));
}));

// Default task
gulp.task('default', gulp.series('clean', 'prod:build', 'html:build'));
gulp.task('dev', gulp.series('clean', 'dev:build', 'html:dev', gulp.parallel('browsersync', 'watch')));