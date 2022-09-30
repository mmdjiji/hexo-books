/* global hexo */
'use strict';

var fs = require('hexo-fs');

var path = require('path');

var log = require('hexo-log')({
  debug: false,
  silent: false
});

var _require = require('./dist/get-bk-data'),
    getBookData = _require.getBookData; // eslint-disable-next-line no-var


if (typeof URL !== 'function') var _require2 = require('url'),
    URL = _require2.URL;
var options = {
  options: [{
    name: '-u, --update',
    desc: 'Update data'
  }, {
    name: '-d, --delete',
    desc: 'Delete data'
  }]
};
hexo.extend.generator.register('books', function (locals) {
  var _this$config, _this$config$books;

  if (!(this !== null && this !== void 0 && (_this$config = this.config) !== null && _this$config !== void 0 && (_this$config$books = _this$config.books) !== null && _this$config$books !== void 0 && _this$config$books.enable)) {
    return;
  }

  if (!fs.existsSync(path.join(this.source_dir, '/images/books/loading.gif'))) {
    fs.copyFile(path.join(__dirname, 'img/loading.gif'), path.join(this.source_dir, '/images/books/loading.gif'));
  }

  return require('./dist/book-generator').call(this, locals);
});
hexo.extend.console.register('books', 'Generate pages of books for Hexo', options, function (args) {
  if (args.d) {
    if (fs.existsSync(path.join(this.source_dir, '/_data/books/index.json'))) {
      fs.unlinkSync(path.join(this.source_dir, '/_data/books/index.json'));
      log.info('books data has been deleted');
    } else {
      log.info('No books data to delete');
    }
  } else if (args.u) {
    var _this$config2;

    if (!(this !== null && this !== void 0 && (_this$config2 = this.config) !== null && _this$config2 !== void 0 && _this$config2.books)) {
      log.info('Please add config to _config.yml');
      return;
    }

    var _this$config$books2 = this.config.books,
        enable = _this$config$books2.enable,
        douban_uid = _this$config$books2.douban_uid,
        download_image = _this$config$books2.download_image;

    if (!enable) {
      return;
    }

    getBookData(douban_uid, download_image, this.source_dir);
  } else {
    log.info('Unknown command, please use "hexo books -h" to see the available commands');
  }
});
