var gulp = require('gulp');  				// gulp
var jslint = require("gulp-jshint");		// js代码检查
var jsmini = require('gulp-uglify');  		// js压缩
var rename = require('gulp-rename');		// 重命名
var del = require('del');					// 目录清理

// 检查js代码
gulp.task('jslint', function () {
    gulp.src('src/js/*.js')
    .pipe(jslint())
    .pipe(jslint.reporter()); // 输出检查结果
});
// 压缩js任务
gulp.task('jsmini', function () {
    gulp.src(['src/js/*.js','!src/js/*.min.js'])	// 获取文件，同时过滤掉.min.js文件
        .pipe(jsmini())
        .pipe(rename(function(path){
		   path.basename += '.min';
		   path.extname = '.js'; 
		}))
        .pipe(gulp.dest('dist/js/'));               // 最终文件
});
// 生产环境js需要压缩
gulp.task('mvfile-dist', function () {
    gulp.src(['src/js/**'])
        .pipe(gulp.dest('dist/js/'))
});

// clean,清理输出目录
gulp.task('clean', function(){
    del('dist/*');
});