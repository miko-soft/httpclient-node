# @mikosoft/httpclient-node
> A simple but powerful HTTP client for Node.js.

Why?
*The HTTP Client leverages the HTTP protocol to establish connections with an HTTP server, which can be a web server, API, or another service. Recognizing the lack of an efficient HTTP Client for Node.js, this library was developed specifically for the Node.js environment. It supports both HTTP and HTTPS protocols, ensuring communication and optimized performance.*


## Features
- Supports GET, POST, PUT, DELETE, and PATCH methods.
- Handles retries and timeouts.
- Supports HTTP and HTTPS requests.
- Can process redirects (3XX).
- Supports gzip and deflate decompression.
- Custom request headers.
- Optional proxy support.
- Can return responses as a buffer for file handling.
- Supports JSON API requests with automatic parsing.
- Provides request and response streams for piping.


## Installation
```sh
npm install --save @mikosoft/httpclient-node
```

## Usage
### Basic Request
```js
const { HttpClient } = require('@mikosoft/httpclient-node');
const httpClient = new HttpClient();
httpClient.askOnce('https://example.com')
  .then(response => {
    console.log(response.res.content);
  })
  .catch(error => console.error(error));
```

### JSON API Request
```js
httpClient.askJSON('https://api.example.com/data', 'POST', { key: 'value' })
  .then(response => console.log(response.res.content))
  .catch(error => console.error(error));
```

### Handling Streams
```js
const fs = require('fs');
httpClient.grabStreams('https://example.com/file.pdf', 'GET')
  .then(({ clientResponse }) => {
    const fileStream = fs.createWriteStream('file.pdf');
    clientResponse.pipe(fileStream);
  })
  .catch(error => console.error(error));
```


## Options
| Option          | Default Value | Description |
|---------------|--------------|-------------|
| `encodeURI` | `false` | Encodes spaces as `%20`. |
| `encoding` | `'utf8'` | Encoding for response content. Use `'binary'` for files. |
| `timeout` | `8000` | Request timeout in milliseconds. |
| `retry` | `3` | Number of retry attempts on failure. |
| `retryDelay` | `5000` | Delay between retries in milliseconds. |
| `maxRedirects` | `3` | Number of redirects to follow. |
| `decompress` | `false` | Enables gzip/deflate decompression. |
| `bufferResponse` | `false` | Returns response as a buffer instead of a string. |
| `debug` | `false` | Enables logging. |

```js
const opts = {
  encodeURI: false,
  encoding: 'utf8',
  timeout: 8000,
  retry: 3,
  retryDelay: 5000,
  maxRedirects: 3,
  decompress: false,
  bufferResponse: false,
  debug: false
};
```


## Proxy Support
To use a proxy, pass an instance of `https-proxy-agent`:

```js
const HttpsProxyAgent = require('https-proxy-agent');
const proxyAgent = new HttpsProxyAgent('http://proxy-server:port');

const clientWithProxy = new HttpClient({}, proxyAgent);
clientWithProxy.ask('https://example.com', 'GET')
  .then(response => console.log(response.res.content));
```


## API

#### constructor(opts:object, proxyAgent:object)

#### askOnce(url:string, method:string, body:object, headers:object)
Send one time HTTP/HTTPS request. Redirection is not handled. Response is a Promise so async/await can be used.
*hcn.askOnce('https://www.dummy-api.com/create', 'POST', {first_name: 'Saša'}, hcn.default_headers);*
```
answer (HTTP response) is formatted as simple object
------------------------------------------------------------
{{
  httpVersion: '1.1',
  https: false,
  req: {
    url: 'http://www.adsuu.com?x=%C4%8Da',
    method: 'GET',
    body: null,
    headers: {
      'user-agent': 'MikoSoft HttpClient-Node/1.0.4',
      accept: '*/*',
      'cache-control': 'no-cache',
      'accept-encoding': 'gzip',
      connection: 'close',
      'content-type': 'text/html; charset=UTF-8'
    },
    query: URLSearchParams { 'x' => 'ča' }
  },
  res: {
    status: 301,
    statusMessage: 'Moved Permanently',
    headers: {
      server: 'nginx/1.17.10 (Ubuntu)',
      date: 'Wed, 12 Mar 2025 10:22:47 GMT',
      'content-type': 'text/html',
      'content-length': '179',
      connection: 'close',
      location: 'https://www.adsuu.com/?x=%C4%8Da'
    },
    content: '<html>\r\n' +
      '<head><title>301 Moved Permanently</title></head>\r\n' +
      '<body>\r\n' +
      '<center><h1>301 Moved Permanently</h1></center>\r\n' +
      '<hr><center>nginx/1.17.10 (Ubuntu)</center>\r\n' +
      '</body>\r\n' +
      '</html>\r\n'
  },
  time: {
    req: '2025-03-12T10:22:47.073Z',
    res: '2025-03-12T10:22:47.291Z',
    duration: 0.218
  },
  opts: {
    encodeURI: true,
    encoding: 'utf8',
    timeout: 8000,
    retry: 3,
    retryDelay: 5000,
    maxRedirects: 3,
    decompress: false,
    bufferResponse: false,
    debug: false
  }
}
```


#### ask(url:string, method:string, body:object, headers:object)
Sends HTTP/HTTPS request to HTTP server. Redirection is handled maxRedirects times. Response is an array of resolved responses for every redirection stage. If there's no redirects then this array will contain only one response.
*hcn.ask('www.yahoo.com');*

```
answers:
-----------------------------
[
  {
    httpVersion: '1.1',
    https: false,
    req: {
      url: 'http://ebay.com',
      method: 'GET',
      body: undefined,
      headers: undefined,
      query: URLSearchParams {}
    },
    res: {
      status: 301,
      statusMessage: 'Moved Permanently',
      headers: {
        server: 'AkamaiGHost',
        'content-length': '0',
        location: 'https://ebay.com/',
        expires: 'Wed, 12 Mar 2025 10:23:56 GMT',
        'cache-control': 'max-age=0, no-cache, no-store',
        pragma: 'no-cache',
        date: 'Wed, 12 Mar 2025 10:23:56 GMT',
        connection: 'close'
      },
      content: 0
    },
    time: {
      req: '2025-03-12T10:23:56.113Z',
      res: '2025-03-12T10:23:56.717Z',
      duration: 0.604
    },
    opts: {
      encodeURI: false,
      encoding: 'utf8',
      timeout: 3000,
      retry: 2,
      retryDelay: 2100,
      maxRedirects: 3,
      decompress: false,
      bufferResponse: false,
      debug: false
    }
  },
  {
    httpVersion: '1.1',
    https: true,
    req: {
      url: 'https://ebay.com/',
      method: 'GET',
      body: undefined,
      headers: undefined,
      query: URLSearchParams {}
    },
    res: {
      status: 301,
      statusMessage: 'Moved Permanently',
      headers: {
        location: 'https://www.ebay.com/',
        'x-ebay-pop-id': 'SLBSLCAZ03',
        server: 'ebay-proxy-server',
        'content-length': '0',
        expires: 'Wed, 12 Mar 2025 10:23:57 GMT',
        'cache-control': 'max-age=0, no-cache, no-store',
        pragma: 'no-cache',
        date: 'Wed, 12 Mar 2025 10:23:57 GMT',
        connection: 'close',
        'strict-transport-security': 'max-age=31536000'
      },
      content: 0
    },
    time: {
      req: '2025-03-12T10:23:56.723Z',
      res: '2025-03-12T10:23:57.973Z',
      duration: 1.25
    },
    opts: {
      encodeURI: false,
      encoding: 'utf8',
      timeout: 3000,
      retry: 2,
      retryDelay: 2100,
      maxRedirects: 3,
      decompress: false,
      bufferResponse: false,
      debug: false
    }
  },
  {
    httpVersion: '1.1',
    https: true,
    req: {
      url: 'https://www.ebay.com/',
      method: 'GET',
      body: undefined,
      headers: undefined,
      query: URLSearchParams {}
    },
    res: {
      status: 200,
      statusMessage: 'OK',
      headers: {
        'x-content-type-options': 'nosniff',
        'x-xss-protection': '1; mode=block',
        'x-frame-options': 'SAMEORIGIN',
        'accept-ch': 'sec-ch-ua-model,sec-ch-ua-platform-version,sec-ch-ua-full-version',
        'content-type': 'text/html; charset=utf-8',
        rlogid: 't6u%60tsodhct%60d13fiiw%3F%3Cqfwrkbkbpfg07%60jhs.22%3Fac1%3F7a%60*e7dae-19589e1e754-0x2305',
        'x-envoy-upstream-service-time': '228',
        server: 'ebay-proxy-server',
        'strict-transport-security': 'max-age=31536000',
        date: 'Wed, 12 Mar 2025 10:23:58 GMT',
        'transfer-encoding': 'chunked',
        connection: 'close, Transfer-Encoding',
        'set-cookie': [Array]
      },
      content: 353695
    },
    time: {
      req: '2025-03-12T10:23:57.975Z',
      res: '2025-03-12T10:23:58.960Z',
      duration: 0.985
    },
    opts: {
      encodeURI: false,
      encoding: 'utf8',
      timeout: 3000,
      retry: 2,
      retryDelay: 2100,
      maxRedirects: 3,
      decompress: false,
      bufferResponse: false,
      debug: false
    }
  }
]
```


#### askJSON(url, method = 'GET', body)
Send HTTP/HTTPS request to API with JSON response. Redirection is not handled because we suppose that APIs are not using redirections.
Parameter body can be either string or object type.
As HTTP Client receives responses as string it will be automatically converted into object.
*hcn.askJSON('http://dummy.restapiexample.com/api/v1/employees');*

```js
// default JSON headers
{
  'content-type': 'application/json; charset=utf-8',
  'accept': 'application/json'
}
```

```
JSON answer:
----------------------------------------
{
  httpVersion: '1.1',
  https: false,
  req: {
    url: 'http://dummy.restapiexample.com/api/v1/employees',
    method: 'GET',
    body: {},
    headers: {
      'content-type': 'application/json; charset=utf-8',
      accept: 'application/json'
    },
    query: URLSearchParams {}
  },
  res: {
    status: 409,
    statusMessage: 'Conflict',
    headers: {
      date: 'Wed, 12 Mar 2025 10:25:57 GMT',
      server: 'Apache',
      'content-length': '83',
      connection: 'close',
      'content-type': 'text/html; charset=iso-8859-1'
    },
    content: '<script>document.cookie = "humans_21909=1"; document.location.reload(true)</script>'
  },
  time: {
    req: '2025-03-12T10:25:56.910Z',
    res: '2025-03-12T10:25:57.698Z',
    duration: 0.788
  },
  opts: {
    encodeURI: false,
    encoding: 'utf8',
    timeout: 3000,
    retry: 1,
    retryDelay: 1300,
    maxRedirects: 3,
    decompress: false,
    bufferResponse: false,
    debug: false
  }
}
```


#### grabStreams(url:string, method:string, body:object, headers:object)
Get request and response streams which can be used for piping. For example:
*const = { clientRequest, clientResponse } = hcn.grabStreams('https://www.example.com/song.mp4');*
*clientResponse.pipe(...);*

```javascript
// send request to telegram
  const opts = {
    encodeURI: false,
    encoding: 'utf8',
    timeout: 8000,
    retry: 0,
    retryDelay: 5500,
    maxRedirects: 0,
    decompress: false,
    bufferResponse: false,
    debug: false
  };
  const hcn = new HttpClient(opts);
  const { clientRequest, clientResponse } = await hcn.grabStreams(`https://api.telegram.org/file/bot${BOT_TOKEN}/${telegram_file_path}`);

  // save file
  const filePath = path.join(process.cwd(), './tmp/proc-pdf', username, fileName);
  await fse.ensureFile(filePath);
  const writer = fse.createWriteStream(filePath);
  clientResponse.pipe(writer);

  // writer events
  writer.on('finish', () => {
    console.log(`File downloaded successfully: ${fileName}`);
  });

  writer.on('error', (err) => {
    console.error(`Error writing file: ${err}`);
  });
```


#### print(obj)
Print the object in the console. Use it to debug the answer.




## AddOns
Additional libraries.

#### RobotsTxt
```js
const { HttpClient, RobotsTxt } = require('@mikosoft/httpclient-node');
const robotsTxt = new RobotsTxt(HttpClient);

const fja = async () => {
  const url = 'https://www.yahoo.com/lifestyle/mom-makes-upsetting-discovery-walmart-134505752.html';
  const robotsText = await robotsTxt.fetch(url);
  console.log('robotsText::');
  console.log(robotsText);

  const robotsTextObj = robotsTxt.parse(robotsText);
  console.log('robotsTextObj::', robotsTextObj);

  const follow_urls = robotsTxt.whatToFollow(robotsTextObj, '*');
  console.log('follow_urls::', follow_urls);

  const unfollow_urls = robotsTxt.whatToUnfollow(robotsTextObj, '*');
  console.log('unfollow_urls::', unfollow_urls);
};

fja();
```




## License
MIT
