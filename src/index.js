/* global hexo */
'use strict';
const fs = require('hexo-fs');
const path = require('path');
const log = require('hexo-log')({
  debug: false,
  silent: false
});

const { getBookData } = require('./dist/get-bk-data');

// eslint-disable-next-line no-var
if (typeof URL !== 'function') var { URL } = require('url');

const options = {
  options: [
    { name: '-u, --update', desc: 'Update data' },
    { name: '-d, --delete', desc: 'Delete data' }
  ]
};
hexo.extend.generator.register('books', function (locals) {
  if (!this?.config?.books?.enable) {
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
    if (!this?.config?.books) {
      log.info('Please add config to _config.yml');
      return;
    }
    const { enable, douban_uid, download_image } = this.config.books;
    if (!enable) {
      return;
    }
    getBookData(douban_uid, download_image, this.source_dir);
  } else {
    log.info('Unknown command, please use "hexo books -h" to see the available commands');
  }
});
