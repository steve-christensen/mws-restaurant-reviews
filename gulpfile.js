'use strict';

const gulp = require('gulp');
const del = require('del');
const browserify = require('browserify');
const through2 = require('through2');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const clean_css = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const rename = require('gulp-rename');
const responsive = require('gulp-responsive');
const concat = require('gulp-concat');


const srcRoot = './src';
const buildRoot = './build';

// set up file paths
const paths = {
    html: {
        src: `${srcRoot}/**/*.html`,
        dest: `${buildRoot}/`
    },
    styles: {
        src: `${srcRoot}/css/**/*.css`,
        dest: `${buildRoot}/css/`
    },
    js: {
        src: `${srcRoot}/**/*.js`,
        main: `${srcRoot}/js/main.js`,
        restaurant: [`${srcRoot}/js/dbhelper.js`, `${srcRoot}/js/restaurant_info.js`],
        dest: `${buildRoot}/`
    },
    images: {
        src: `${srcRoot}/img_src/*.jpg`,
        dest: `${buildRoot}/img/`,
        fixed: `${srcRoot}/img_src/fixed/*.jpg`
    }
};

const imageOptions = {
        '*.jpg': [{
            width: 320,
            rename: { suffix: '-320_sm' }
        },
        {
            width: 560,
            rename: { suffix: '-560_md' }
        },
        {
            width: 800,
            rename: { suffix: '-800_lg' }
        }]

    };

const imageQuality = {
        quality: 70,
        progressive: true,
        withMetadata: false
    };


gulp.task('clean', () => del([buildRoot]));

gulp.task('copyFiles', () =>
  gulp.src([paths.js.src, `${srcRoot}/**/*.css`])
      .pipe(gulp.dest(paths.js.dest))
  );

gulp.task('buildJS', function () {
  return gulp.src([paths.js.src])
    .pipe(through2.obj(function (file, enc, next){
            console.log(`Building JS for: ${file.path}`)
            browserify(file.path)
                .transform('babelify')
                .bundle(function(err, res) {
                    if (err) {
                      console.log(err);
                    }
                    else {
                      // assumes file.contents is a Buffer
                      file.contents = res;
                      next(null, file);
                    }
                });
        }))
    .pipe(sourcemaps.init({loadMaps: true}))
/*    .pipe(uglify({ mangle: {
          reserved: ['updateRestaurants','DBHelper']
        }
      }))
*/
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(paths.js.dest));
});

gulp.task('buildHTML', () =>
    gulp.src([paths.html.src])
        .pipe(gulp.dest(paths.html.dest)));

gulp.task('buildCSS', () =>
    gulp.src([paths.styles.src])
        .pipe(clean_css({ sourceMap: true}))
        .pipe(autoprefixer('last 2 version'))
        .pipe(rename({ suffix: '.min'}))
        .pipe(gulp.dest(paths.styles.dest)));

const cleanImages = () => del([paths.images.dest]);

const copyFixedImages = () =>
    gulp.src([paths.images.fixed])
        .pipe(gulp.dest(paths.images.dest));

const responsiveImages = () =>
    gulp.src([paths.images.src])
        .pipe(responsive(imageOptions, imageQuality))
        .pipe(gulp.dest(paths.images.dest, {overwrite: false}));

gulp.task('images', gulp.series(cleanImages, copyFixedImages, responsiveImages));

//gulp.task('default', gulp.series(['clean',gulp.parallel(['images','copyFiles','buildJS','buildCSS','buildHTML'])]));
gulp.task('default', gulp.series(['clean',gulp.parallel(['images','buildJS','buildCSS','buildHTML'])]));
