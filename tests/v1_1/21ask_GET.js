/**
 * $ node 21ask_GET.js <url>
 * $ node 21ask_GET.js yahoo.com
 */
const util = require('util');
const HttpClient = require('../../HttpClient.js');
const url = process.argv[2];

console.log('asked url:: GET', url);


const getUrl = async () => {
  const opts = {
    encodeURI: false,
    encoding: 'utf8',
    timeout: 8000,
    retry: 3,
    retryDelay: 5500,
    maxRedirects: 3,
    decompress: false,
    bufferResponse: false,
    debug: false
  };

  try {
    const hcn = new HttpClient(opts); // http client instance
    const answer = await hcn.ask(url);
    hcn.print(answer);

  } catch (err) {
    throw err;
  }
};


getUrl().catch(console.error);




