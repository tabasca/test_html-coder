"use strict";

//////////////////////////////

var gulp = require("gulp");
var sass = require("gulp-sass");
var pug = require("gulp-pug");
var plumber = require("gulp-plumber");
var postcss = require("gulp-postcss");
var autoprefixer = require('gulp-autoprefixer');
var watch = require('gulp-watch');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var rigger = require('gulp-rigger');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var rimraf = require('gulp-dest-clean');
var concat = require('gulp-concat');
var rename = require("gulp-rename");
var browserSync = require("browser-sync");
var reload = browserSync.reload;

var gulpLoadPlugins = require("gulp-load-plugins");

var $ = gulpLoadPlugins({camelize: true});

var path = {
    build: { //Тут мы укажем куда складывать готовые после сборки файлы
        html: 'build/',
        js: 'build/js/',
        css: 'build/css/',
        img: 'build/img/',
        fonts: 'build/fonts/'
    },
    src: { //Пути откуда брать исходники
        html: 'source/*.pug', // все файлы с расширением .html
        js: ['source/js/vendors/*.js', 'source/js/*.js'],
        style: ['source/sass/style.scss'],
        img: 'source/img/**/*.{jpg,jpeg,png,gif}',
        imgsvg: 'source/img/**/*.svg',
        fonts: 'source/fonts/**/*.*'
    },
    watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
        html: 'source/**/*.pug',
        js: 'source/js/**/*.js',
        style: 'source/sass/**/*.scss',
        img: 'source/img/**/*.{jpg,jpeg,png,gif}',
        imgsvg: 'source/img/**/*.svg',
        fonts: 'source/fonts/**/*.*'
    },
    clean: './build'
};

// Переменная с настройками dev сервера
var config = {
    server: {
        baseDir: "./build"
    },
    tunnel: true,
    host: 'localhost',
    port: 9000,
    logPrefix: "test"
};

// Сборка HTML
gulp.task('html', function () {
    gulp.src(path.src.html)
        .pipe(pug({
            pretty: true
        }).on('error', $.notify.onError(function (error) {
            return 'Error: ' + error.message;
        })))
        .pipe(gulp.dest(path.build.html))
        .pipe(reload({stream: true}));
});

// Сборка javascript (TODO: not optimised (for test task only))
gulp.task('js', function () {
    gulp.src(path.src.js) //Найдем наши js
        .pipe(rigger()) //Прогоним через rigger
        .pipe(sourcemaps.init()) //Инициализируем sourcemap
        .pipe(sourcemaps.write()) //Пропишем карты
        .pipe(concat('main.js'))
        .pipe(gulp.dest(path.build.js)) //Выплюнем готовый файл в build
        .pipe(uglify()) //Сожмем наш js
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(path.build.js)) //Выплюнем готовый файл в build
        .pipe(reload({stream: true})); //И перезагрузим сервер
});

// Сборка стилей
gulp.task('style:build', function () {
    gulp.src(path.src.style) //Выберем style.less
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: 'compressed'
        })) //Скомпилируем
        .pipe(autoprefixer()) //Добавим вендорные префиксы
        .pipe(sourcemaps.write())
        .pipe(concat('style.css'))
        .pipe(gulp.dest(path.build.css))
        .pipe(reload({stream: true}));
});

// Сборка стилей
gulp.task('style:dev', function () {
    gulp.src(path.src.style) //Выберем style.less
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: 'compact'
        }).on('error', $.notify.onError(function (error) {
            return 'Error: ' + error.message;
        })))
        .pipe(sourcemaps.write())
        .pipe(concat('style.css'))
        .pipe(gulp.dest(path.build.css))
        .pipe(reload({stream: true}));
});

// Сжатие картинок
gulp.task('imagemin', function () {
    gulp.src(path.src.img) //Выберем наши картинки
        .pipe(imagemin({ //Сожмем их
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(path.build.img))
        .pipe(reload({stream: true}));
});

// Сжатие .svg
gulp.task('imagesvg', function () {
    gulp.src(path.src.imgsvg) //Выберем наши картинки
        .pipe(imagemin({ //Сожмем их
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            interlaced: true
        }))
        .pipe(gulp.dest(path.build.img))
        .pipe(reload({stream: true}));
});

// Шрифты
gulp.task('fonts', function() {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
});

// Локальный веб-сервер
gulp.task('webserver', function () {
    browserSync(config);
});

// Очистка build
gulp.task('clean', function (cb) {
    rimraf(path.clean, cb);
});

// Сборка prod
gulp.task('build', [
    'html',
    'js',
    'style:build',
    'fonts',
    'imagemin',
    'imagesvg'
]);

// Сборка dev
gulp.task('dev', [
    'html',
    'js',
    'style:dev',
    'fonts',
    'imagemin',
    'imagesvg',
    'webserver',
    'watch'
]);

// Отслеживание изменений
gulp.task('watch', function(){
    watch([path.watch.html], function(event, cb) {
        gulp.start('html');
    });
    watch([path.watch.style], function(event, cb) {
        gulp.start('style:dev');
    });
    watch([path.watch.js], function(event, cb) {
        gulp.start('js');
    });
    watch([path.watch.img], function(event, cb) {
        gulp.start('imagemin');
    });
    watch([path.watch.imgsvg], function(event, cb) {
        gulp.start('imagesvg');
    });
    watch([path.watch.fonts], function(event, cb) {
        gulp.start('fonts');
    });
});
