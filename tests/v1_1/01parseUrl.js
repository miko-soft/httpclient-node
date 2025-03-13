/**
 * $ node 01paresUrl.js <url>
 * $ node 01parseUrl.js http://adsuu.com?x=22
 * $ node 01parseUrl.js https://localhost:8001/test?x=22
 */

const HttpClient = require('../../HttpClient.js');
const url = process.argv[2];

console.log('url:: ', url);

const opts = {
  encodeURI: false // if true => ads.com?x=č -> http://ads.com?x=%C4%8D
};

const httpClient = new HttpClient(opts);
const parsedUrl = httpClient._parseUrl(url);

console.log('parsedUrl::', parsedUrl);



/*
EXAMPLE #1 --- $ node 01parseUrl.js "http://www.adsuu.com/some/thing.php?x=2&y=3"
=================================================================================
url::  http://www.adsuu.com/some/thing.php?x=2&y=3
URL {
  href: 'http://www.adsuu.com/some/thing.php?x=2&y=3',
  origin: 'http://www.adsuu.com',
  protocol: 'http:',
  username: '',
  password: '',
  host: 'www.adsuu.com',
  hostname: 'www.adsuu.com',
  port: '',
  pathname: '/some/thing.php',
  search: '?x=2&y=3',
  searchParams: URLSearchParams { 'x' => '2', 'y' => '3' },
  hash: ''
}


EXAMPLE #2 --- $ node 01parseUrl.js "https://localhost:8001/some/thing.php?x=2&y=3"
===================================================================================
url::  https://localhost:8001/some/thing.php?x=2&y=3
URL {
  href: 'https://localhost:8001/some/thing.php?x=2&y=3',
  origin: 'https://localhost:8001',
  protocol: 'https:',
  username: '',
  password: '',
  host: 'localhost:8001',
  hostname: 'localhost',
  port: '8001',
  pathname: '/some/thing.php',
  search: '?x=2&y=3',
  searchParams: URLSearchParams { 'x' => '2', 'y' => '3' },
  hash: ''
}


EXAMPLE #3 --- $ node 01parseUrl.js "https://www.dex8.com/contact"
=================================================================
url::  https://www.dex8.com/contact
URL {
  href: 'https://www.dex8.com/contact',
  origin: 'https://www.dex8.com',
  protocol: 'https:',
  username: '',
  password: '',
  host: 'www.dex8.com',
  hostname: 'www.dex8.com',
  port: '',
  pathname: '/contact',
  search: '',
  searchParams: URLSearchParams {},
  hash: ''
}


EXAMPLE #4 --- $ node 01parseUrl.js "www.adsuu.com" (corrected URL)
===================================================================
url::  www.adsuu.com
URL {
  href: 'http://www.adsuu.com/',
  origin: 'http://www.adsuu.com',
  protocol: 'http:',
  username: '',
  password: '',
  host: 'www.adsuu.com',
  hostname: 'www.adsuu.com',
  port: '',
  pathname: '/',
  search: '',
  searchParams: URLSearchParams {},
  hash: ''
}

*/
