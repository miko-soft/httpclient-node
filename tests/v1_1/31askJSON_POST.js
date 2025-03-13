/**
 * $ node 31askJSON_POST.js <url> <body_str>
 * $ node 31askJSON_POST.js https://jsonplaceholder.typicode.com/posts "{\"x\": 78}"
 * Example shows how to proceed body as a string in JSON format.
 */
const HttpClient = require('../../HttpClient.js');
const url = process.argv[2];
const body_str = process.argv[3]; // this is String
console.log('asked url:: POST', url);


const getJSON = async () => {
  const opts = {
    encodeURI: false,
    encoding: 'utf8',
    timeout: 3000,
    retry: 0,
    retryDelay: 1300,
    maxRedirects: 0,
    decompress: false,
    bufferResponse: false,
    debug: false
  };

  try {
    const hcn = new HttpClient(opts);
    const answer = await hcn.askJSON(url, 'POST', body_str);

    console.log('answer:\n', answer);

  } catch (err) {
    throw err;
  }
};


getJSON().catch(console.log);




