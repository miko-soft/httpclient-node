/**
 * $ node 40get_gz.js
 * Get .gz file.
 */
const util = require('util');
const HttpClient = require('../../HttpClient.js');
const url = 'https://common.elisaviihde.fi/sitemaps/events-s1.xml.gz';
console.log('asked url:: GET', url);


const getGZ = async () => {
  try {
    const opts = {
      encodeURI: false,
      encoding: 'utf8',
      timeout: 8000,
      retry: 3,
      retryDelay: 5500,
      maxRedirects: 3,
      headers: {
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
        'accept': '*/*', // 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
        'cache-control': 'no-cache',
        'accept-encoding': 'gzip',
        'connection': 'close', // keep-alive
        'content-type': 'text/html; charset=UTF-8'
      },
      decompress: true, // MUST BE SET TO true !
      bufferResponse: false,
      debug: false
    };
    const hcn = new HttpClient(opts); //  http client instance
    const answer = await hcn.askOnce(url);
    console.log(util.inspect(answer, false, 3, true));

  } catch (err) {
    throw err;
  }
};


getGZ().catch(console.error);




