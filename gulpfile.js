'use strict';

// Load the dependencies
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
const pump = require('pump');
const sass = require('gulp-sass');

const srcRoot = './src';
const buildRoot = './build';

// set up file paths
const paths = {
    html: {
      src: `${srcRoot}/**/*.html`,
      dest: `${buildRoot}/`
    },
    styles: {
      src: `${srcRoot}/scss/**/*.scss`,
      dest: `${buildRoot}/css/`
    },
    js: {
      src: `${srcRoot}/**/*.js`,
      exclude: `!${srcRoot}/lib/**/*.js`,
      dest: `${buildRoot}/`
    },
    files: {
      src: [`${srcRoot}/**/*.json`, `${srcRoot}/**/*.js`]
    },
    idb: {
      src: './node_modules/idb/lib/idb.js',
      dest: `${buildRoot}/lib/`
    },
    images: {
      src: `${srcRoot}/img_src/*.jpg`,
      dest: `${buildRoot}/img/`,
      fixed: `${srcRoot}/img_src/fixed/*.*`
    }
};

// Options for building responsive images
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

// More responsive image options
const imageQuality = {
        quality: 70,
        progressive: true,
        withMetadata: false
    };

// Task to delete the build directory and start with a blank slate.
gulp.task('clean', () => del([buildRoot]));

// Copy any files that do not require build
gulp.task('copyFiles', () =>
  gulp.src(paths.files.src)
      .pipe(gulp.dest(buildRoot))
);

// Copy idb.js
gulp.task('idbCopy', () =>
  gulp.src(paths.idb.src)
      .pipe(gulp.dest(paths.idb.dest))
);

// Build the Javascript via browserify, babel, and uglify
// Added pump because it generates better error messages
// when there are syntax errors in the code.
gulp.task('buildJS', (cb) => {
  pump([
    gulp.src([paths.js.src,paths.js.exclude]),
    through2.obj(function (file, enc, next){
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
        }),
        sourcemaps.init({loadMaps: true}),
        uglify(),
        sourcemaps.write('./'),
        rename((path) =>
          {
            path.basename += path.extname == '.map' ? '' : '.min';
          }),
        gulp.dest(paths.js.dest)
  ],cb);
});


// Build the HTML, for now, it just copies the files
gulp.task('buildHTML', () =>
    gulp.src([paths.html.src])
        .pipe(gulp.dest(paths.html.dest)));

// Build the CSS. I could use sass and add that compilation here
gulp.task('buildCSS', () =>
    gulp.src([paths.styles.src])
//        .pipe(sass({ outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(sass({ includePaths: [`${buildRoot}/scss`]}).on('error', sass.logError))
        .pipe(autoprefixer('last 2 version'))
        .pipe(rename({ suffix: '.min'}))
        .pipe(gulp.dest(paths.styles.dest)));

// Delete the image target directory
const cleanImages = () => del([paths.images.dest]);

// Copy images that I manually edited.
// These won't e replaced by the responsiveImages task
const copyFixedImages = () =>
    gulp.src([paths.images.fixed])
        .pipe(gulp.dest(paths.images.dest));

// Build the responsive images. gulp-responsive uses 'sharp'
const responsiveImages = () =>
    gulp.src([paths.images.src])
        .pipe(responsive(imageOptions, imageQuality))
        .pipe(gulp.dest(paths.images.dest, {overwrite: false}));

// Task to bundle the image tasks
gulp.task('images', gulp.series(cleanImages, copyFixedImages, responsiveImages));

// Task to bundle the full build process
//gulp.task('buildAll', gulp.series(['clean',gulp.parallel(['images','buildJS','buildCSS','buildHTML', 'copyFiles'])]));
gulp.task('buildAll', gulp.series(['clean',gulp.parallel(['images','buildCSS','buildHTML', 'copyFiles'])]));

// Task to reload BrowserSync
const reload = (done) => {
  server.reload();
  done();
}

// Default task: BuildAll, launch app with BrowserSync, and watch for changes
gulp.task('default', gulp.series(['buildAll']));
