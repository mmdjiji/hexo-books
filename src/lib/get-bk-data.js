/* eslint-disable */
const fs = require('hexo-fs');
const path = require('path');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const log = require('hexo-log')({
  debug: false,
  silent: false
});

const BGMTV_TYPE = {
  1: '书籍',
  2: '动画',
  3: '音乐',
  4: '游戏',
  6: '三次元'
};

const LIMIT = 15;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36 Edg/105.0.1343.33';


const catchSeries = async (cookie, douban_uid, category) => {
  let offset = 0;
  let total = 0;
  const watchList = [];
  do {
    const res = await (await fetch(`https://book.douban.com/people/${douban_uid}/${category}?start=${offset}&sort=time&rating=all&filter=all&mode=grid`, {
      headers: {
        'User-Agent': USER_AGENT,
        Cookie: cookie
      }
    })).text();

    const $ = cheerio.load(res);

    total = $('title').text().match(/(\d+)/)[0];
    let list = $('ul[class=interest-list]').children();

    for (let i = 0; i < LIMIT; ++i) {
      if(list.html()) {
        const $ = cheerio.load(list.html());
        const href = $('a[class=nbg]').attr('href');
        const image = $('img').attr('src');
        const title = $('div[class=info]').children().children('a').attr('title');
        const pub = $('div[class=pub]').text().trim();
        const id = href.match(/\d+/)[0];
        watchList.push({ id, title, href, image, pub });
        list = list.next();
      }
    }
    offset += LIMIT;
  } while (offset < total);
  return watchList;
}

// get a user's book list
const getBookList = async (cookie, douban_uid) => {
  if (douban_uid) {
    const wantWatch = await catchSeries(cookie, douban_uid, 'wish');  // type=1
    const watching = await catchSeries(cookie, douban_uid, 'do');     // type=3
    const watched = await catchSeries(cookie, douban_uid, 'collect'); // type=2
  
    const total = wantWatch.length + watching.length + watched.length;

    log.info(`Get book list successfully, found ${total} books`);
    return { wantWatch, watching, watched };
  }
};

// get a book by id
const getBook = async (cookie, book, cachePath) => {
  const book_id = book.id;
  const savedPath = path.join(cachePath, `/${book_id}.json`);
  if (await fs.exists(savedPath)) {
    try {
      const read = await JSON.parse(await fs.readFile(savedPath));
      if (read.id === book_id) {
        return read;
      } else {
        throw new Error(`Id not match when trying to load id = ${book_id}`);
      }
    } catch (error) {
      // invalid bangumi
      console.error(error);
      return undefined;
    }
  }

  try {
    const req = await fetch(`https://book.douban.com/subject/${book_id}`, {
      headers: {
        'User-Agent': USER_AGENT,
        Cookie: cookie
      }
    });
    if (req.status === 200) {
      const item = await req.text();

      const $ = cheerio.load(item);
      let list = $('div[class=intro]').children().first();
      let intro = '';
      do {
        intro += list?.text();
        list = list.next();
      } while(list?.text());
      book.intro = intro;

      fs.writeFile(savedPath, JSON.stringify(book), (err) => {
        if (err) {
          log.info(`Failed to write data to cache/${book_id}.json`);
          console.error(err);
        }
      });
      return book;
    }
  } catch (error) {
    log.info(`Failed to get book (${book_id}), please check network!`);
    return undefined;
    // console.log(error);
  }
  fs.writeFile(savedPath, '{}', (err) => { // mark as invalid book
    if (err) {
      log.info(`Failed to write data to cache/${book_id}.json`);
      console.error(err);
    }
  });
  log.info(`Get book (${book_id}) Failed, maybe invalid!`);
};

const getImage = (image_url, imagesPath) => {
  if (image_url && !fs.existsSync(`${imagesPath}/${image_url.match(/s\d+.jpg/)[0]}`)) {
    fetch(image_url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/octet-stream' }
    }).then((res) => res.buffer())
      .then((image) => {
        fs.writeFile(`${imagesPath}/${image_url.match(/s\d+.jpg/)[0]}`, image, 'binary', (err) => {
          console.error(err);
        });
      });
  }
};

module.exports.getBookData = async (douban_uid, download_image, source_dir) => {
  // create folders if not exist
  const booksPath = path.join(source_dir, '/_data/books');
  const cachePath = path.join(booksPath, '/cache');
  const imagesPath = path.join(source_dir, '/images/books');
  const pathList = [booksPath, cachePath, imagesPath];
  for (const i of pathList) {
    if (!fs.existsSync(i)) {
      fs.mkdirsSync(i);
    }
  }

  // Bypass anti-spider, get /favicon.ico and get bid || set-cookie
  const spider = await(await fetch('https://book.douban.com/favicon.ico', {
    headers: {
      'User-Agent': USER_AGENT
    }
  }));
  let cookie = '';
  const bid = spider.headers.get('x-douban-newbid');
  const setCookie = spider.headers.get('set-cookie');
  if (bid) {
    cookie = `bid=${bid}`;
  } else if (setCookie) {
    cookie = setCookie;
  }

  // get user's bangumi list
  const bookList = douban_uid ? (await getBookList(cookie, douban_uid)) : (await JSON.parse(fs.readFileSync(path.join(booksPath, '/index.json'))));

  if (douban_uid) {
    fs.writeFile(path.join(booksPath, '/index.json'), JSON.stringify(bookList), (err) => {
      if (err) {
        log.info('Failed to write data to books/index.json');
        console.error(err);
      }
    });
  }

  // for each book, get its information in detail
  const batch = async (list) => {
    const result = [];
    for (const item of list) {
      const info = await getBook(cookie, item, cachePath);
      if (info) {
        result.push(info);
        if (download_image) {
          getImage(info.image, imagesPath);
        }
        log.info(`Get book 《${info.title}》 (${info.id}) Success!`);
      }
    }
    return result;
  };

  const wantWatch = (await batch(bookList.wantWatch));//.sort((a, b) => a.updated_at - b.updated_at);
  const watching = (await batch(bookList.watching));//.sort((a, b) => a.updated_at - b.updated_at);
  const watched = (await batch(bookList.watched));//.sort((a, b) => a.updated_at - b.updated_at);

  const result = { wantWatch, watching, watched };

  fs.writeFile(path.join(booksPath, '/books.json'), JSON.stringify(result), (err) => {
    if (err) {
      log.info('Failed to write data to cache/books.json');
      console.error(err);
    }
  });

  const total = bookList.wantWatch.length + bookList.watching.length + bookList.watched.length;
  const succeed = result.wantWatch.length + result.watching.length + result.watched.length;
  const failed = total - succeed;
  log.info(`Generated books.json, total ${total} books, ${succeed} succeed, ${failed} failed`);
};
