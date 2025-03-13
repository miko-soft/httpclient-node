/**
 * $ node 20ask_GET.js <url>
 *
 * // redirection test
 * $ node 20ask_GET.js ebay.com
 *
 * // timeout test
 * set opts.timeout = 10;
 */

const util = require('util');
const HttpClient = require('../../HttpClient.js');
const url = process.argv[2];

console.log('asked url:: GET', url);


const getUrl = async () => {
  const opts = {
    encodeURI: false,
    encoding: 'utf8',
    timeout: 3000,
    retry: 2,
    retryDelay: 2100,
    maxRedirects: 3,
    decompress: false,
    bufferResponse: false,
    debug: false
  };


  try {
    const hcn = new HttpClient(opts); // http client instance
    const answers = await hcn.ask(url);

    console.log('answers:: ');
    console.log(util.inspect(answers.map(a => { a.res.content = a.res.content ? a.res.content.length : 0; return a; }), false, 3, true));

  } catch (err) {
    throw err;
  }
};


getUrl().catch(console.error);




