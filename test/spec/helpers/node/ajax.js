"use strict";
var http = require("http");
var url = require("url");
var stream = require("stream");
var httpAgent = require("_http_agent");

class MockAgent extends http.Agent {
  constructor() {
    super();
    this._caughtRequests = [];
  }
  addRequest(req, opt) {
    this._caughtRequests.push(new MockRequest(req, opt));
  }

  getLastRequest() {
    return this._caughtRequests.shift();
  }
}

class MockRequest {
  constructor(req, opt) {
    this._req = req;

    opt.host = null;

    this.url = url.format(opt);
    this.method = req.method;
    this.requestHeaders = opt.headers;
    this.params = {};
    this.params.size = opt.headers["Content-Length"];
  }

  respondWith(options) {
    let res = new MockResponse();
    res.statusCode = options.status;
    res.headers = {};

    // Node's http module expects the keys for be lower cased
    for (var key in options.responseHeaders) {
      res.headers[key.toLowerCase()] = options.responseHeaders[key];
    }

    this._req.emit("response", res);
  }

  contentType() {
    return this.requestHeaders["Content-Type"] || "";
  }
}

class MockResponse extends stream.Readable {
  _read() {
    this.push(null);
  }
}

let agent = new MockAgent();
let originalAgent = httpAgent.globalAgent;

class Ajax {
  install() {
    httpAgent.globalAgent = agent;
  }

  uninstall() {
    httpAgent.globalAgent = originalAgent;
  }
}

let ajax = new Ajax();
ajax.requests = {};
ajax.requests.mostRecent = function () {
  return agent.getLastRequest();
};

jasmine.Ajax = ajax;
