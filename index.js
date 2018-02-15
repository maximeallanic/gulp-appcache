"use strict";

var es        = require('event-stream'),
    through   = require('through'),
    gutil     = require('gulp-util'),
    crypto    = require('crypto'),
    path      = require('path'),
    slash     = require('slash'),
    lineBreak = '\n';

function manifest(options) {
  options = options || {};
  var contents = {
      files: []
  };

  var filename = options.filename || 'app.manifest';
  var exclude = [].concat(options.exclude || []);
  var hasher = crypto.createHash('sha256');

  function writeToManifest(file) {
    if (file.isNull())   return;
    if (file.isStream()) return this.emit('error', new gutil.PluginError('gulp-manifest',  'Streaming not supported'));

    if (exclude.indexOf(file.relative) >= 0) {
      return;
    }

    contents.files.push('/' + ((options.relativePath|| '').replace(/([^\/])$/, "$1/") || '')+encodeURI(slash(file.relative)));

    if (options.hash) {
      hasher.update(file.contents, 'binary');
    }
  }

  function endStream() {
    if (options.hash)
      contents.hash = hasher.digest("hex");
    else
      contents.hash = new Date();

    var cwd = process.cwd();
    var manifestFile = new gutil.File({
      cwd: cwd,
      base: cwd,
      path: path.join(cwd, filename),
      contents: new Buffer(JSON.stringify(contents))
    });

    this.emit('data', manifestFile);
    this.emit('end');
  }

  return through(writeToManifest, endStream);
}

module.exports = manifest;
