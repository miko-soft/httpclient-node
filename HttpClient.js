/**
 * Simple but powerful HTTP client for NodeJS.
 */
const http = require('http');
const https = require('https');
const url_node = require('url');
const zlib = require('zlib');
const util = require('util');
const pkg_json = require('./package.json');



class HttpClient {

  /**
   * @param {object} opts - HTTP Client options
   * @param {object} proxyAgent - proxy agent (https://www.npmjs.com/package/https-proxy-agent)
   */
  constructor(opts = {}, proxyAgent) {
    // options
    this.opts = {
      encodeURI: opts.encodeURI || false, // use encodeURI() - remove multiple empty spaces and insert %20
      encoding: opts.encoding || 'utf8', // default 'utf8'. Use 'binary' for PDF files, and revert it to buffer with Buffer.from(answer.res.content, 'binary')
      timeout: opts.timeout || 8000, // wait for response in miliseconds (agent tomeiut definition)
      retry: opts.retry || 3, // how many time to retry on failed response. It's used only in ask() method.
      retryDelay: opts.retryDelay || 5000, // deley between two consecutive retries.  It's used only in ask() method.
      maxRedirects: opts.maxRedirects || 3, // how many 3XX redirects to process. It's used only in ask() method.
      decompress: opts.decompress || false, // to decompress gzip or deflate or not
      bufferResponse: opts.bufferResponse || false, // Get answer.res.content as buffer. The buffer content can be used in FormData: const fd = new Formdata(); fd.append('file', answer.res.content)
      debug: opts.debug || false // show logs in the console
    };

    // default request headers
    this.default_headers = {
      'user-agent': `MikoSoft HttpClient-Node/${pkg_json.version}`, // 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36'
      'accept': '*/*', // 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
      'cache-control': 'no-cache',
      'accept-encoding': 'gzip',
      'connection': 'close', // keep-alive
      'content-type': 'text/html; charset=UTF-8'
    };

    // proxy
    this.proxyAgent = proxyAgent;
  }



  /********** REQUESTS *********/

  /**
   * Sending one HTTP request to HTTP server.
   *  - 301 redirections are not handled
   *  - retries are not handled
   * @param {string} url - https://www.adsuu.com/contact
   * @param {string} method - GET, POST, PUT, DELETE, PATCH
   * @param {object} body - http body payload
   * @param {object} headers - http request headers
   */
  askOnce(url, method = 'GET', body, headers) {
    // answer proto object
    const answer_proto = {
      httpVersion: undefined,
      https: undefined,
      // remoteAddress: // TODO
      // referrerPolicy: // TODO
      req: {
        url,
        method,
        body,
        headers,
        query: undefined
      },
      res: {
        status: 0,
        statusMessage: '',
        headers: undefined,
        content: undefined
      },
      time: {
        req: this._getTime(),
        res: undefined,
        duration: undefined
      },
      opts: this.opts
    };



    /*** 1.a) check and correct URL ***/
    try {
      url = this._correctUrl(url);
    } catch (err) {
      const answer = { ...answer_proto }; // clone object to prevent overwrite of proto object properies
      answer.res.statusMessage = err.message || 'Bad URL definition';
      answer.time.res = this._getTime();
      answer.time.duration = this._getTimeDiff(answer.time.req, answer.time.res);
      return answer;
    }

    /*** 1.b) parse URL ***/
    const urlParsed = this._parseUrl(url); // {url, protocol, hostname, port, host, pathname, queryString, queryObject, isHttps}

    /*** 2) init HTTP request  [http.request() options https://nodejs.org/api/http.html#http_http_request_url_options_callback] ***/
    const requestLib = this._selectRequest(urlParsed.isHttps);
    const agent = this._hireAgent(urlParsed.isHttps);
    const requestOpts = {
      agent,
      protocol: urlParsed.protocol,
      hostname: urlParsed.hostname,
      port: urlParsed.port ? urlParsed.port : urlParsed.isHttps ? 443 : 80,
      host: urlParsed.host,
      path: urlParsed.pathname + urlParsed.queryString,
      method,
      headers
    };

    let clientRequest;
    if (/GET/i.test(method)) {  // GET  - no body
      if (requestOpts.headers && requestOpts.headers['content-length']) { delete requestOpts.headers['content-length']; } // remove content-length
      clientRequest = requestLib(requestOpts);

    } else { // POST, PUT, DELETE, ... - with body
      const body_str = JSON.stringify(body);
      const contentLength = Buffer.byteLength(body_str, this.opts.encoding);
      requestOpts.headers['content-length'] = contentLength; // add content-length
      clientRequest = requestLib(requestOpts);
      clientRequest.write(body_str, this.opts.encoding);
    }


    /*** 3) send request ***/
    const promise = new Promise((resolve, reject) => {

      /** 3.A) successful response **/
      clientRequest.on('response', clientResponse => {
        // collect raw data e.g. buffer data
        const buf_chunks = [];
        clientResponse.on('data', (buf_chunk) => {
          buf_chunks.push(buf_chunk);
        });


        const resolveAnswer = () => {
          clearTimeout(timeoutID);

          // concat buffer parts
          let buf = Buffer.concat(buf_chunks);

          // decompress
          if (this.opts.decompress) {
            const isResponseGzip = !!clientResponse.headers['content-encoding'] && clientResponse.headers['content-encoding'] === 'gzip';
            const isResponseDeflate = !!clientResponse.headers['content-encoding'] && clientResponse.headers['content-encoding'] === 'deflate';
            if (isResponseGzip) {
              buf = zlib.gunzipSync(buf); // decompress gzip
            } else if (isResponseDeflate) {
              buf = zlib.inflateSync(buf); // decompress deflate
            } else {
              buf = zlib.unzipSync(buf); // decompress both gzip or deflate
            }
          }

          // convert buffer to string
          let content;
          if (this.opts.bufferResponse) {
            content = buf; // when the URL is file
          } else {
            content = buf.toString(this.opts.encoding);
          }

          // format answer
          const answer = { ...answer_proto }; // clone object to prevent overwrite of object properies
          answer.httpVersion = clientResponse.httpVersion;
          answer.https = urlParsed.isHttps;
          answer.req.url = url;
          answer.req.query = urlParsed.queryObject; // from ?a=sasa&b=2 => {a:'sasa', b:2}
          answer.res.status = clientResponse.statusCode; // 2xx -ok response, 4xx -client error (bad request), 5xx -server error
          answer.res.statusMessage = clientResponse.statusMessage;
          answer.res.headers = clientResponse.headers;
          answer.res.content = content;
          answer.time.res = this._getTime();
          answer.time.duration = this._getTimeDiff(answer.time.req, answer.time.res);
          resolve(answer);

          this._killAgent(agent);
        };


        // when server sends normal response
        clientResponse.on('end', resolveAnswer);

        // when server sends HTTP header Connection: 'keep-alive' the res.on('end', ...) is never fired
        const timeoutID = setTimeout(resolveAnswer, this.opts.timeout);
      });


      /** 3.B) on timeout (no response from the server) **/
      clientRequest.setTimeout(this.opts.timeout);
      clientRequest.on('timeout', () => {
        clientRequest.abort();
        this._killAgent(agent);

        // format answer
        const answer = { ...answer_proto }; // clone object to prevent overwrite of proto object properies
        answer.res.status = 408; // 408 - timeout
        answer.res.statusMessage = `Request aborted due to timeout (${this.opts.timeout} ms) ${url} `;
        answer.time.res = this._getTime();
        answer.time.duration = this._getTimeDiff(answer.time.req, answer.time.res);

        resolve(answer);
      });


      /** 3.C) on error (only if promise is not resolved by timeout - prevent double resolving) **/
      clientRequest.on('error', error => {
        this._killAgent(agent);
        const err = this._formatError(error, url);

        // format answer
        const answer = { ...answer_proto }; // clone object to prevent overwrite of object properies
        answer.res.status = err.status;
        answer.res.statusMessage = err.message;
        answer.time.res = this._getTime();
        answer.time.duration = this._getTimeDiff(answer.time.req, answer.time.res);

        resolve(answer);
      });

    });


    /*** 4) finish with sending request */
    clientRequest.end();


    return promise;

  } // \askOnce



  /**
   * Sending HTTP request to HTTP server.
   *  - 301 redirections are handled.
   *  - retries are handled
   * @param {string} url - https://www.adsuu.com/contact
   * @param {string} method - GET, POST, PUT, DELETE, PATCH
   * @param {object} body - http body payload
   * @param {object} headers - http request headers
   */
  async ask(url, method = 'GET', body, headers) {
    let answer = await this.askOnce(url, method, body, headers);
    const answers = [answer];


    /*** a) HANDLE 3XX REDIRECTS */
    let redirectCounter = 1;
    while (!!answer && /^3\d{2}/.test(answer.res.status) && redirectCounter <= this.opts.maxRedirects) { // 300, 301, 302, ...
      const from = url;
      const to = answer.res.headers.location || '';
      const url_new = url_node.resolve(from, to); // redirected URL is in 'location' header
      this.opts.debug && console.log(`#${redirectCounter} redirection ${answer.res.status} from ${this.url} to ${url_new}`);

      answer = await this.askOnce(url_new, method, body, headers); // repeat request with new url
      answers.push(answer);

      redirectCounter++;
    }


    /*** b) HANDLE RETRIES when status = 408 timeout */
    let retryCounter = 1;
    while (answer.res.status === 408 && retryCounter <= this.opts.retry) {
      this.opts.debug && console.log(`#${retryCounter} retry due to timeout (${this.opts.timeout}) on ${url}`);
      await new Promise(resolve => setTimeout(resolve, this.opts.retryDelay)); // delay before retrial

      answer = await this.askOnce(url, method, body, headers);
      answers.push(answer);

      retryCounter++;
    }


    return answers;
  }



  /**
   * Send request and get response in JSON format. Suitable for API.
   * @param {string} url - https://api.adsuu.com/contact
   * @param {string} method - GET, POST, PUT, DELETE, PATCH
   * @param {object|string} body - http body as Object or String type
   * @param {object} headers - http request headers
   */
  async askJSON(url, method = 'GET', body, headers) {
    // convert body string to object
    let body_obj = body;
    if (typeof body === 'string') {
      try {
        body_obj = JSON.parse(body);
      } catch (err) {
        throw new Error('Body string is not valid JSON.');
      }
    } else if (!body) { // undefined, null or empty string
      body_obj = {};
    }

    // JSON request headers
    const headers2 = headers ??
    {
      'content-type': 'application/json; charset=utf-8',
      'accept': 'application/json'
    };

    const answer = await this.askOnce(url, method, body_obj, headers2);

    // convert string to object if the content has valid JSON format
    try {
      if (answer.res.content) {
        answer.res.content = JSON.parse(answer.res.content);
      }
    } catch (err) {
      console.log(`The answer's res.content has invalid JSON: ${answer.res.content}`);
    }

    return answer;
  }




  /**
   * Get request and response streams which can be used for piping. For example: clientResponse.pipe(file)
   * @param {string} url - https://www.dex8.com
   * @param {string} method - GET, POST, PUT, DELETE, PATCH
   * @param {object} body - http body payload (when for example the POST method is used)
   * @param {object} headers - http request headers
   * @returns {Promise<{clientrequest:Stream, clientResponse:Stream}>}
   */
  grabStreams(url, method = 'GET', body, headers) {
    /*** 1.a) check and correct URL ***/
    url = this._correctUrl(url);

    /*** 1.b) parse URL ***/
    const urlParsed = this._parseUrl(url); // {url, protocol, hostname, port, host, pathname, queryString, queryObject, isHttps}

    /*** 2) init HTTP request ***/
    const requestLib = this._selectRequest(urlParsed.isHttps);
    const agent = this._hireAgent(urlParsed.isHttps);
    const requestOpts = {
      agent,
      protocol: urlParsed.protocol,
      hostname: urlParsed.hostname,
      port: urlParsed.port ? urlParsed.port : urlParsed.isHttps ? 443 : 80,
      host: urlParsed.host,
      path: urlParsed.pathname + urlParsed.queryString,
      method,
      headers
    };

    let clientRequest;
    if (/GET/i.test(method)) {  // GET  - no body
      if (requestOpts.headers && requestOpts.headers['content-length']) { delete requestOpts.headers['content-length']; } // remove content-length
      clientRequest = requestLib(requestOpts);

    } else { // POST, PUT, DELETE, ... - with body
      const body_str = JSON.stringify(body);
      const contentLength = Buffer.byteLength(body_str, this.opts.encoding);
      requestOpts.headers['content-length'] = contentLength; // add content-length
      clientRequest = requestLib(requestOpts);
      clientRequest.write(body_str, this.opts.encoding);
    }

    const promise = new Promise((resolve, reject) => {
      clientRequest.on('response', clientResponse => {
        resolve({ clientRequest, clientResponse });
      });

      clientRequest.setTimeout(this.opts.timeout);

      clientRequest.on('timeout', () => {
        this._killAgent(agent);
        reject(new Error(`The timeout after ${this.opts.timeout} ms`));
      });

      clientRequest.on('error', error => {
        this._killAgent(agent);
        reject(error);
      });

      clientRequest.end();
    });

    return promise;
  }


  /********** MISC *********/
  /**
   * Print the object to the console.
   * @param {object} obj
   */
  print(obj) {
    const opts = {
      showHidden: false,
      depth: 5,
      colors: true,
      customInspect: true,
      showProxy: false,
      maxArrayLength: 10,
      maxStringLength: 350,
      breakLength: 80,
      compact: false,
      sorted: false,
      getters: false,
      numericSeparator: false
    };
    console.log(util.inspect(obj, opts));
  }




  /********** PRIVATES *********/

  /**
   * Parse url.
   * @param {string} url - http://www.adsuu.com/some/thing.php?x=2&y=3
   */
  _parseUrl(url) {
    const urlObj = new url_node.URL(url);

    const urlParsed = {
      url: urlObj.href, // Use href for the full URL
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port,
      host: urlObj.host,
      pathname: urlObj.pathname,
      queryString: urlObj.search,
      queryObject: urlObj.searchParams,
      isHttps: /^https/.test(url),
    };

    // debug
    if (this.opts.debug) {
      console.log('url:: ', urlParsed.url); // http://localhost:8001/www/products?category=mačke
      console.log('protocol:: ', urlParsed.protocol); // http:
      console.log('hostname:: ', urlParsed.hostname); // localhost
      console.log('port:: ', urlParsed.port); // 8001
      console.log('host:: ', urlParsed.host); // localhost:8001
      console.log('pathname:: ', urlParsed.pathname); // /www/products
      console.log('queryString:: ', urlParsed.queryString); // ?category=mačke
      console.log('queryObject:: ', urlParsed.queryObject); // { 'category' => 'mačke' }
    }

    return urlParsed;
  }


  /**
   * URL corrections
   */
  _correctUrl(url) {
    if (!url) { throw new Error('URL is not defined'); }
    if (typeof url !== 'string') { throw new Error('URL is not string data type'); }

    // 1. trim from left and right
    url = url.trim();

    // 2. add protocol
    if (!/^https?:\/\//.test(url)) {
      url = 'http://' + url;
    }

    // 3. remove multiple empty spaces and insert %20
    if (this.opts.encodeURI) {
      url = encodeURI(url);
    } else {
      url = url.replace(/\s+/g, ' ');
      url = url.replace(/ /g, '%20');
    }

    return url;
  }


  /**
   * Convert string into integer, float or boolean.
   * @param {string} value
   * @returns {string|number|boolean|object}
   */
  _typeConvertor(value) {
    function isJSON(str) {
      try { JSON.parse(str); }
      catch (err) { return false; }
      return true;
    }

    if (!!value && !isNaN(value) && value.indexOf('.') === -1) { // convert string into integer (12)
      value = parseInt(value, 10);
    } else if (!!value && !isNaN(value) && value.indexOf('.') !== -1) { // convert string into float (12.35)
      value = parseFloat(value);
    } else if (value === 'true' || value === 'false') { // convert string into boolean (true)
      value = JSON.parse(value);
    } else if (isJSON(value)) {
      value = JSON.parse(value);
    }

    return value;
  }


  /**
   * Create query object from query string.
   * @param  {string} queryString - x=abc&y=123&z=true
   * @return {object}             - {x: 'abc', y: 123, z: true}
   */
  _toQueryObject(queryString) {
    const queryArr = queryString.replace(/^\?/, '').split('&');
    const queryObject = {};

    let eqParts, property, value;
    queryArr.forEach(elem => {
      eqParts = elem.split('='); // equotion parts
      property = eqParts[0];
      value = eqParts[1];

      value = this._typeConvertor(value); // t y p e   c o n v e r s i o n
      value = !this.opts.encodeURI ? decodeURI(value) : value;

      if (!!property) { queryObject[property] = value; }
    });

    return queryObject;
  }


  /**
   * Choose http or https NodeJS libraries.
   */
  _selectRequest(isHttps) {
    const requestLib = isHttps ? https.request.bind(https) : http.request.bind(http);
    return requestLib;
  }


  /**
   * Create new http/https agent https://nodejs.org/api/http.html#http_new_agent_options
   */
  _hireAgent(isHttps) {
    let agent;
    if (!!this.proxyAgent) {
      agent = this.proxyAgent;
    } else {
      // default agent options https://nodejs.org/api/http.html#http_new_agent_options
      const options = {
        timeout: this.opts.timeout, // close socket on certain period of time
        keepAlive: false, // keep socket open so it can be used for future requests without having to reestablish new TCP connection (false)
        keepAliveMsecs: 1000, // initial delay to receive packets when keepAlive:true (1000)
        maxSockets: Infinity, // max allowed sockets (Infinity)
        maxFreeSockets: 256, // max allowed sockets to leave open in a free state when keepAlive:true (256)
      };
      agent = isHttps ? new https.Agent(options) : new http.Agent(options);
    }
    return agent;
  }


  /**
   * Kill the agent when it finish its job.
   */
  _killAgent(agent) {
    agent.destroy();
  }


  /**
   * Beautify error messages.
   * @param {Error} error - original error
   * @return formatted error
   */
  _formatError(error, url) {
    const err = new Error(error);

    // reformatting NodeJS errors
    if (error.code === 'ENOTFOUND') {
      err.status = 404;
      err.message = `404 Bad Request [ENOTFOUND] ${url}`;
    } else if (error.code === 'ECONNREFUSED') {
      err.status = 400;
      err.message = `400 Bad Request [ECONNREFUSED] ${url}`;
    } else if (error.code === 'ECONNRESET') {
      err.status = 500;
      err.message = `500 No Server Response [ECONNRESET] ${url}`; // replacing: Error: socket hang up
    } else if (error.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
      err.status = 400;
      err.message = `400 Bad Request [ERR_TLS_CERT_ALTNAME_INVALID] ${error.reason}`;
    } else if (error.status === 404) {
      err.status = 404;
      err.message = `404 Not Found ${url}`;
    } else {
      err.status = error.status || 400;
      err.message = error.message;
    }

    err.original = error;

    return err; // formatted error is returned
  }


  /**
   * Get current date/time
   */
  _getTime() {
    const d = new Date();
    return d.toISOString();
  }


  /**
   * Get time difference in seconds
   */
  _getTimeDiff(start, end) {
    const ds = new Date(start);
    const de = new Date(end);
    return (de.getTime() - ds.getTime()) / 1000;
  }




}



module.exports = HttpClient;
