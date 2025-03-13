/**
 * $ node 41get_gz_askOnce.js
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




