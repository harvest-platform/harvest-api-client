import { assert } from 'chai';
import { fetch } from 'whatwg-fetch';

// Patched version.
import { XMLHttpRequest } from './XMLHttpRequest';

// Make global for the Node environment.
global.fetch = fetch;
global.XMLHttpRequest = XMLHttpRequest;

import Client from '..'

const TEST_URL = process.env.TEST_URL || 'http://harvest.research.chop.edu/demo/api/';
const TEST_USER = process.env.TEST_USER || 'testuser';
const TEST_PASS = process.env.TEST_PASS || 'testuser';

describe('Client', function() {
  const client = new Client(TEST_URL);

  const creds = {
    username: TEST_USER,
    password: TEST_PASS
  };

  describe('auth', function() {
    it('should get a token', function(done) {
      client.open(creds)
        .then(function(response) {
          assert.ok(client._token, 'token not set');
          done();
        })
        .catch((error) => done(error));
    });
  });

  describe('ping', function() {
    it('should ping', function(done) {
      client.ping()
        .then(function(response) {
          assert.isOk(response);
          done();
        })
        .catch((error) => done(error));
    });
  });

  describe('categories', function() {
    it('should get all', function(done) {
      client.categories.all()
        .then(function(data) {
          assert.isAtLeast(data.length, 1);
          done();
        })
        .catch((error) => done(error));
    });
  });


  describe('fields', function() {
    it('should get all', function(done) {
      client.fields.all()
        .then(function(data) {
          assert.isAtLeast(data.length, 1);
          done();
        })
        .catch((error) => done(error));
    });
  });

  // TODO: implement queryable and viewable
  describe('concepts', function() {
    it('should get all', function(done) {
      client.concepts.all()
        .then(function(data) {
          assert.isAtLeast(data.length, 1);
          done();
        })
        .catch((error) => done(error));
    });

    it('should get one', function(done) {
      client.concepts.get(10)
        .then(function(data) {
          assert.equal(data.length, 1);
          done();
        })
        .catch((error) => done(error));
    });

    it('should search', function(done) {
      client.concepts.search('mrn')
        .then(function(data) {
          assert.isAtLeast(data.length, 1);
          done();
        })
        .catch((error) => done(error));
    });
  });

  describe('contexts', function() {
    it('should get all', function(done) {
      client.contexts.all()
        .then(function(data) {
          assert.isOk(true);
          done();
        })
        .catch((error) => done(error));
    });

    it('should get one', function(done) {
      client.contexts.get('session')
        .then(function(data) {
          assert.equal(data.length, 1);
          done();
        })
        .catch((error) => done(error));
    });
  });

  describe('views', function() {
    it('should get all', function(done) {
      client.views.all()
        .then(function(data) {
          assert.isOk(true);
          done();
        })
        .catch((error) => done(error));
    });

    it('should get one', function(done) {
      client.views.get(10)
        .then(function(data) {
          assert.equal(data.length, 1);
          done();
        })
        .catch((error) => done(error));
    });
  });

  describe('queries', function() {
    it('should get all', function(done) {
      client.queries.all()
        .then(function(data) {
          assert.isOk(true);
          done();
        })
        .catch((error) => done(error));
    });

    it('should get all public', function(done) {
      client.queries.public()
        .then(function(data) {
          assert.isOk(true);
          done();
        })
        .catch((error) => done(error));
    });

    it('should get one', function(done) {
      client.queries.get(10)
        .then(function(data) {
          assert.equal(data.length, 1);
          done();
        })
        .catch((error) => done(error));
    });
  });

  describe('data', function() {
    it('should get a preview', function(done) {
      client.data.preview()
        .then(function(data) {
          assert.isOk(true);
          done();
        })
        .catch((error) => done(error));
    });

    it('should get an export', function(done) {
      client.data.export('json')
        .then(function(data) {
          assert.equal(data.length, 1);
          done();
        })
        .catch((error) => done(error));
    });
  });

  describe('stats', function() {
    it('should get counts', function(done) {
      client.stats.counts()
        .then(function(data) {
          assert.isOk(true);
          done();
        })
        .catch((error) => done(error));
    });
  });
})
