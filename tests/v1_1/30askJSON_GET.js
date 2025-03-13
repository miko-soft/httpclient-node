/**
 * $ node 30askJSON_GET.js <url>
 * $ node 30askJSON_GET.js https://jsonplaceholder.typicode.com/posts/1
 */
const util = require('util');
const HttpClient = require('../../HttpClient.js');
const url = process.argv[2];
console.log('asked url:: GET', url);


const getJSON = async () => {
  const opts = {
    encodeURI: false,
    encoding: 'utf8',
    timeout: 3000,
    retry: 1,
    retryDelay: 1300,
    maxRedirects: 0,
    decompress: false,
    bufferResponse: false,
    debug: false
  };

  try {
    const hcn = new HttpClient(opts);
    const answer = await hcn.askJSON(url, 'GET');

    console.log('answer:');
    console.log(util.inspect(answer, false, 3, true));


    // another request
    const answer2 = await hcn.askJSON('https://jsonplaceholder.typicode.com/posts/2');
    console.log('\n\nanswer2::', answer2);

  } catch (err) {
    throw err;
  }
};


getJSON().catch(console.error);




