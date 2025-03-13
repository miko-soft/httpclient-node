/**
 * $ node 10askOnce_GET.js <url>
 * $ node 10askOnce_GET.js http://www.adsuu.com?x=ča
 * $ node 10askOnce_GET.js http://api.dex8.com?x=ča
 * $ node 10askOnce_GET.js https://www.dex8.com/products/robots
 */
const util = require('util');
const HttpClient = require('../../HttpClient.js');
const url = process.argv[2];

console.log('asked url:: GET', url);


const getUrl = async () => {
  const hcn = new HttpClient({ encodeURI: true, debug: false }); //  http client instance

  console.log('default_headers::', hcn.default_headers);

  const answer = await hcn.askOnce(url, 'GET', null, hcn.default_headers);

  answer.res.content = answer.res.content?.slice(0, 200); // shorten the console.log
  console.log(`\nanswer:`, util.inspect(answer, false, 3, true));
};


getUrl().catch(console.log);
