import parseLinkHeader from 'parse-link-header';

import urlparams from 'url-params';
import linktemplate from './linktemplate';

const DEFAULT_MONITOR_INTERVAL = 30000;  // 30 seconds

function parseData(resp) {
  return resp.json().then(function(data) {
    return data;
  });
}

// Parse Link and Link-Template headers and set them on the target.
function parseLinks(target, resp) {
  target._links = parseLinkHeader(resp.headers.get('link'));
  target._linkTemplates = parseLinkHeader(resp.headers.get('link-template'));
  return resp
}

// Promises: http://stackoverflow.com/a/26077620/407954
function logError(error) {
  // TODO: send error to service.
  // console.log(error);

  const msg = error.toString();

  if (/failed to fetch/i.test(msg)) {
    throw new Error('Could not connect to server');
  } else {
    throw error;
  }
}

function throwNotOpen() {
  throw new Error('session not open');
}

function throwUnknownLink(name) {
  throw new Error(`unknonwn link ${name}`);
}

// Constructs and throws a response status error.
function throwStatusError(resp) {
  let err = new Error(resp.statusText || 'http error: ' + resp.status);
  err.type = resp.status;
  err.response = resp;
  err.url = resp.url;
  throw err;
}

// Constructs and throws a timeout-based error.
function throwTimeoutError(resp) {
  let err = new Error('timeout');
  err.type = 'timeout';
  err.response = resp;
  err.url = resp.url;
  throw err;
}

// Construct and throw error for unexpected status.
function checkClientServerError(resp) {
  if (resp.status >= 400) throwStatusError(resp);
  return resp;
}


// Resource is the base type for all resources.
class Resource {
  constructor(client: Client) {
    this.client = client;
  }
}


class Categories extends Resource {
  all() {
    const url = this.client.rel('categories');
    return this.client.do({ url })
      .then((resp) => parseLinks(this, resp))
      .then(parseData);
  }
}

class Fields extends Resource {
  all() {
    const url = this.client.rel('fields');
    return this.client.do({ url })
      .then((resp) => parseLinks(this, resp))
      .then(parseData)
  }
}

class Concepts extends Resource {
  // TODO: cache for other methods.
  all() {
    const url = this.client.rel('concepts');
    return this.client.do({ url })
      .then(parseData);
  }

  queryable() {
    return this.all().then(function(list) {
      return list.filter(function(c) {
        return c.queryable;
      });
    });
  }

  viewable() {
    return this.all().then(function(list) {
      return list.filter(function(c) {
        return c.viewable;
      });
    });
  }

  search(query) {
    if (!query) throw new Error('query required');

    const url = this.client.rel('concepts');
    return this.client.do({
      url: url,
      params: {'query': query}
    })
      .then(parseData);
  }

  get(id) {
    if (!id) throw new Error('id required');

    const url = this.client.rel('concept', {id: id});
    return this.client.do({ url })
      .then(parseData);
  }
}


class Contexts extends Resource {
  all() {
    const url = this.client.rel('contexts');
    return this.client.do({ url })
      .then(parseData);
  }

  get(id) {
    if (!id) throw new Error('id required');

    const url = this.client.rel('context', {id: id});
    return this.client.do({ url })
      .then(parseData);
  }
}

class Views extends Resource {
  all() {
    const url = this.client.rel('views');
    return this.client.do({ url })
      .then(parseData);
  }

  get(id) {
    if (!id) throw new Error('id required');

    const url = this.client.rel('view', {id: id});
    return this.client.do({ url })
      .then(parseData);
  }
}

class Queries extends Resource {
  all() {
    const url = this.client.rel('queries');
    return this.client.do({ url })
      .then(parseData);
  }

  public() {
    const url = this.client.rel('public_queries');
    return this.client.do({ url })
      .then(parseData);
  }

  get(id) {
    if (!id) throw new Error('id required');

    const url = this.client.rel('query', {id: id});
    return this.client.do({ url })
      .then(parseData);
  }
}

class Data extends Resource {
  preview() {
    const url = this.client.rel('preview');
    return this.client.do({ url })
      .then(parseData);
  }

  export(type) {
    if (!type) throw new Error('type required');

    const url = this.client.rel('export', {type: type});
    return this.client.do({ url })
      .then(parseData);
  }
}


class Stats extends Resource {
  counts() {
    const url = this.client.rel('stats_counts');
    return this.client.do({ url })
      .then(parseData);
  }
}

// Client is a client for the Harvest HTTP service.
class Client {

  constructor(url) {
    if (!url) {
      throw new Error('URL required');
    }

    this.url = url;

    // Internal state.
    this._token = null;
    this._monitor = null;

    // API
    this.categories = null;
    this.concepts = null;
    this.fields = null;
    this.contexts = null;
    this.views = null;
    this.queries = null;
    this.data = null;
    this.stats = null;
  }

  // Ping sends a request to the server to check if the session
  // is still alive. If not, a timeout error will be thrown.
  ping() {
    const url = this.rel('ping');
    return this.do({url: url})
      .then(function(resp) {
        // Ping should always return a 200.
        if (resp.ok) {
          const data = resp.json();
          // Session timed out according to the server.
          if (data.status === 'timeout') {
            throwTimeoutError(resp);
          }
          return resp;
        }
        throwStatusError(resp);
      })

  }

  // Open opens the session. For servers that require authentication,
  // credentials can be passed.
  open(creds) {
    let method = 'GET',
      body,
      headers;

    if (creds) {
      if (creds.username) {
        method = 'POST';
        body = creds;
      } else if (creds.token) {
        this._token = creds.token;
      } else {
        throw new Error('credentials must be username/password or token.');
      }
    }

    return this.do({url: this.url, method, body, headers})
      .then((resp) => {
        parseLinks(this, resp);

        // Start a monitor.
        clearTimeout(this._monitor);

        this._monitor = setInterval(() => {
          // When an error occurs, close the session.
          this.ping()
            .catch((error) => this.close());
        }, DEFAULT_MONITOR_INTERVAL);

        let res;

        // Extract the token from the response body.
        if (creds) {
          // Extract the token from the response,
          // return the session object to chain.
          res = resp.json().then((data) => {
            this._token = data.token;
            return this;
          });
        } else {
          res = this;
        }

        // Initialize API.
        this.categories = new Categories(this);
        this.concepts = new Concepts(this);
        this.fields = new Fields(this);
        this.contexts = new Contexts(this);
        this.views = new Views(this);
        this.queries = new Queries(this);
        this.data = new Data(this);
        this.stats = new Stats(this);

        return res;
      });
  }

  // Close closes the session.
  close() {
    clearTimeout(this._monitor);
    delete this._token;
    delete this._links;
  }

  // Returns a related URL by name.
  rel(name, vars) {
    if (vars) {
      if (!this._linkTemplates || !this._linkTemplates[name]) {
        throwUnknownLink(name);
      }
      return linktemplate.sub(this._linkTemplates[name].url, vars);
    }

    if (!this._links || !this._links[name]) {
      throwUnknownLink(name)
    }

    return this._links[name].url;
  }

  // Prepares and sends a request.
  do({url, method = 'GET', body, params, headers = {}}) {
    const options = {
      method: method,
      credentials: 'include',
      headers: headers
    };

    if (!options.headers['Accept']) {
      options.headers['Accept'] = 'application/json';
    }

    if (body) {
      if (!options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
      }

      if (options.headers['Content-Type'] === 'application/json') {
        options.body = JSON.stringify(body);
      } else {
        options.body = body;
      }
    }

    if (params) {
      for (let key in params) {
        url = urlparams.set(url, key, params[key]);
      }
    }

    if (this._token) {
      options.headers['Api-Token'] = this._token;
    }

    // Perform the fetch and check for unexpected errors.
    return fetch(url, options)
      .then(checkClientServerError)
      .catch(logError);
  }

}

export default Client;
