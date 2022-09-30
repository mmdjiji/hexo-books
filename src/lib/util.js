'use strict';

const I18N = require('hexo-i18n');

const i18n = new I18N({
  languages: ['zh-CN', 'zh-TW', 'en']
});

i18n.set('en', {
  wantWatch: 'Wish',
  watched: 'Read',
  watching: 'Reading',
  prev: 'Prev',
  next: 'Next',
  top: 'Top',
  end: 'End'
});

i18n.set('zh-TW', {
  wantWatch: '想读',
  watched: '读过',
  watching: '在读',
  prev: '上一頁',
  next: '下一頁',
  top: '首頁',
  end: '尾頁'
});

i18n.set('zh-Hans', {
  wantWatch: '想读',
  watched: '读过',
  watching: '在读',
  prev: '上一页',
  next: '下一页',
  top: '首页',
  end: '尾页'
});

i18n.set('zh-CN', {
  wantWatch: '想读',
  watched: '读过',
  watching: '在读',
  prev: '上一页',
  next: '下一页',
  top: '首页',
  end: '尾页'
});

module.exports.i18n = i18n;
