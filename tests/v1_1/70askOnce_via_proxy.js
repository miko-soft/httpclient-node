/**
 * $ node 70askOnce_via_proxy.js
 */
const util = require('util');
const HttpClient = require('../../HttpClient.js');
const { HttpProxyAgent } = require('http-proxy-agent'); // for http: proxy protocol
const { HttpsProxyAgent } = require('https-proxy-agent'); // for https: proxy protocol
const { SocksProxyAgent } = require('socks-proxy-agent'); // for socks4: or socks5: proxy protocol


const getUrl = async (url, proxyUrl) => {
  console.log(proxyUrl, ' --> ', url);


  // define proxy agent
  const proxyUrl_obj = proxyUrl ? new URL(proxyUrl) : {};
  const proxyProtocol = proxyUrl_obj.protocol;
  console.log('proxyProtocol::', proxyProtocol);

  let proxyAgent;
  if (proxyProtocol === 'http:' || proxyProtocol === 'https:') {
    proxyAgent = new HttpsProxyAgent(proxyUrl);
  } else if (proxyProtocol === 'socks4:' || proxyProtocol === 'socks5:') {
    proxyAgent = new SocksProxyAgent(proxyUrl);
  }

  // options
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



  const hcn = new HttpClient(opts, proxyAgent); // http client instance

  const answer = await hcn.askOnce(url);
  hcn.print(answer);
};




/*** IP Checker ***/
// const url = 'https://api.ipify.org?format=json';
const url = 'https://api.dex8.com/ip';
// const url = 'https://www.whatismyip.com/';
// const url = 'https://ipchicken.com/';
// const url = 'https://www.ip2location.com/demo';
// const url = 'https://www.myip.com/';

/*** Dynamic Website ***/
// const url = 'http://95.111.249.142:3457/';


/*** Proxies ***/
// const proxyUrl = undefined; // direct request to destination website (proxy is not used)
// const proxyUrl = 'http://hmviujxi:0a6a4x21gmiz@204.44.69.89:6342'; // proxy direct connection
const proxyUrl = 'http://hmviujxi-1:0a6a4x21gmiz@p.webshare.io:80'; // backbone connection
// const proxyUrl = 'http://hmviujxi-1:0a6a4x21gmiz@5.154.254.2:80'; // backbone IP connection - used IP instead of p.webshare.io
// const proxyUrl = 'http://hmviujxi-rotate:0a6a4x21gmiz@p.webshare.io:80'; // rotate proxy

// const proxyUrl = 'socks5://hmviujxi:0a6a4x21gmiz@204.44.69.89:6342';

// const proxyUrl = 'https://hmviujxi:0a6a4x21gmiz@204.44.69.89:6342'; // WILL NOT WORK !!!
// const proxyUrl = 'socks4://hmviujxi:0a6a4x21gmiz@204.44.69.89:6342'; // WILL NOT WORK !!!


getUrl(url, proxyUrl).catch(console.log);
