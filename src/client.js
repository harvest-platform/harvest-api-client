import parseLinkHeader from 'parse-link-header';

import urlparams from 'url-params';
import linktemplate from './linktemplate';

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

function throwUnknownLink(name) {
  throw new Error(`unknown link "${name}"`);
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
    return this.client.do({ rel: 'categories' })
      .then((resp) => parseLinks(this, resp))
      .then(parseData);
  }
}

class Fields extends Resource {
  all() {
    return this.client.do({ rel: 'fields' })
      .then((resp) => parseLinks(this, resp))
      .then(parseData)
  }
}

class Concepts extends Resource {
  all() {
    return this.client.do({ rel: 'concepts' })
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
    return this.client.do({ rel: 'concepts', params: {query} })
      .then(parseData);
  }

  get(id) {
    if (!id) throw new Error('id required');
    return this.client.do({ rel: 'concept', vars: {id} })
      .then(parseData);
  }
}


class Contexts extends Resource {
  all() {
    return this.client.do({ rel: 'contexts' })
      .then(parseData);
  }

  get(id) {
    if (!id) throw new Error('id required');
    return this.client.do({ rel: 'context', vars: {id} })
      .then(parseData);
  }
}

class Views extends Resource {
  all() {
    return this.client.do({ rel: 'views' })
      .then(parseData);
  }

  get(id) {
    if (!id) throw new Error('id required');
    return this.client.do({ rel: 'view', vars: {id} })
      .then(parseData);
  }
}

class Queries extends Resource {
  all() {
    return this.client.do({ rel: 'queries' })
      .then(parseData);
  }

  public() {
    return this.client.do({ rel: 'public_queries' })
      .then(parseData);
  }

  get(id) {
    if (!id) throw new Error('id required');
    return this.client.do({ rel: 'query', vars: {id} })
      .then(parseData);
  }
}

class Data extends Resource {
  preview({ page, limit, context, view }) {
    const params = { page, limit };

    let body;
    if (context || view) {
      body = { context, view };
    }

    return this.client.do({ rel: 'preview', body, params })
      .then(parseData);
  }

  export({ format, context, view }) {
    if (!format) throw new Error('format required');

    let body;
    if (context || view) {
      body = { context, view };
    }

    return this.client.do({ rel: 'export', vars: {type: format}, body })
      .then(parseData);
  }
}


class Stats extends Resource {
  counts() {
    return this.client.do({ rel: 'stats_counts' })
      .then(parseData);
  }
}

// Client is a client for the Harvest HTTP service.
class Client {
  constructor(opts) {
    if (!opts) {
      throw new Error('URL or config object required.');
    }

    // URL passed.
    if (typeof opts  === 'string') {
      this.url = opts;
    } else {
      this.url = opts.url;
      this.username = opts.username;
      this.password = opts.password;
      this.token = opts.token;
    }

    // Resources.
    this.categories = new Categories(this);
    this.concepts = new Concepts(this);
    this.fields = new Fields(this);
    this.contexts = new Contexts(this);
    this.views = new Views(this);
    this.queries = new Queries(this);
    this.data = new Data(this);
    this.stats = new Stats(this);
  }

  // ping sends a request to the server to check if the session
  // is still alive. If not, a timeout error will be thrown.
  ping() {
    return this.do({ rel: 'ping' })
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

  // rel returns a related URL by name.
  rel(name, vars) {
    if (vars) {
      if (!this._linkTemplates[name]) throwUnknownLink(name);
      return linktemplate.sub(this._linkTemplates[name].url, vars);
    }

    if (!this._links[name]) throwUnknownLink(name);
    return this._links[name].url;
  }

  // _send actually constructs and sends the request.
  _send({ url, method, body, params, headers = {}}) {
    const options = {
      credentials: 'include',
      headers: headers
    };

    if (!options.headers['Accept']) {
      options.headers['Accept'] = 'application/json';
    }

    if (body) {
      // Default to JSON.
      if (!options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
      }

      if (options.headers['Content-Type'] === 'application/json') {
        options.body = JSON.stringify(body);
      } else {
        options.body = body;
      }

      if (!method) {
        method = 'POST';
      }
    } else if (!method) {
      method = 'GET';
    }

    if (params) {
      for (let key in params) {
        url = urlparams.set(url, key, params[key]);
      }
    }

    if (this.token) {
      options.headers['Api-Token'] = this.token;
    }

    options.method = method;

    // Perform the fetch and check for unexpected errors.
    return fetch(url, options)
      .then(checkClientServerError)
  }

  // Open opens the session. For servers that require authentication,
  // credentials can be passed.
  _auth() {
    const url = this.url;
    const method = 'POST';
    const body = {
      username: this.username,
      password: this.passsword
    };

    return this._send({ url, method, body })
      .then((resp) => {
        // Extract the token from the response. return the response
        // to chain with caller.
        return resp.json().then((data) => {
          this.token = data.token;
          return resp;
        });
      });
  }

  _init() {
    let p;

    // Username is supplied, but no token has been retrieved.
    // Authentication first.
    if (this.username) {
      p = this._auth();
    } else {
      p = this._send({ url: this.url });
    }

    // Parse the links.
    return p.then((resp) => {
      parseLinks(this, resp);
      return resp;
    });
  }

  // do is public method for sending a request.
  do({ url, rel, vars, method, body, params, headers }) {
    let p;

    if (!this._links) {
      p = this._init();
    } else {
      p = Promise.resolve();
    }

    return p.then(() => {
      if (rel) url = this.rel(rel, vars);
      return this._send({ url, method, body, params, headers });
    });
  }
}

export default Client;
