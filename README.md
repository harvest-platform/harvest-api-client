# Harvest API Client

JavaScript client library for the Harvest API.

## Install

```
npm install harvest-api-client
```

## Usage

- All remote calls return promises.
- Each level of the API is accessed through objects.

```js
import Client from 'harvest-api-client'

const client = new Client('http://harvest.research.chop.edu/demo/api/');

// Open the session. For APIs that require credentials, an object with
// the `username` and `password` fields or a `token` field may be set.
client.open()
  .then(function() {
    // Sesssion successfully open.
  })
  .catch(function(error) {
    // An error occurred opening the session.
  });
```

### TODOs

- Provide all links and link-templates in top-level resource.
