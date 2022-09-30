'use strict';

const ejs = require('ejs');
const path = require('path');
const { i18n } = require('hexo-books/src/lib/util');
const fs = require('hexo-fs');
const log = require('hexo-log')({
  debug: false,
  silent: false
});

module.exports = async function (locals) {
  const { config } = this;
  if (!config?.books?.enable) {
    return;
  }

  let { root } = config;
  if (root.endsWith('/')) {
    root = root.slice(0, root.length - 1);
  }
  let wantWatch = [];
  let watching = [];
  let watched = [];
  if (!fs.existsSync(path.join(this.source_dir, '/_data/books/books.json'))) {
    log.info('Can\'t find books.json, please use "hexo books -u" command to get data');
  } else {
    ({ wantWatch, watching, watched } = JSON.parse(fs.readFileSync(path.join(this.source_dir, '/_data/books/books.json'))));

    log.info(`${wantWatch.length + watching.length + watched.length} books have been loaded`);
  }

  // eslint-disable-next-line no-underscore-dangle
  const __ = i18n.__(config.language);

  const contents = await ejs.renderFile(path.join(__dirname, 'templates/book.ejs'), {
    quote: config.books.quote,
    show: config.books.show || 1,
    loading: config.books.loading,
    color_meta: config.books.color_meta ? `style="color:${config.books.color_meta}"` : '',
    color: config.books.color ? `style="color:${config.books.color}"` : '',
    lazyload: config.books.lazyload ?? true,
    margin: config.books.margin ?? '20px',
    download_image: config.books.download_image ?? false,
    image_level: config.books.image_level ?? 'c',
    wantWatch,
    watched,
    watching,
    __,
    root
  }, { async: false });

  const customPath = config.books.path;
  return {
    path: customPath || ('books/index.html'),
    data: {
      title: config.books.title,
      content: contents,
      ...config?.books?.extra_options
    },
    layout: ['page', 'post']
  };
};
