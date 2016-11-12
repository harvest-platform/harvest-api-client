# Harvest JS

JavaScript client library for Harvest.

## Usage

- All remote calls return promises.
- Each level of the API is accessed through objects.

```js
import Client from 'harvest-js'

var client = new Client('http://harvest.research.chop.edu/demo/api/');

// Open the session. For servers that require credentials, an object
// with the `username` and `password` fields can be set.
client.open()
  .then(function() {

    // Set some state that the client has successfully opened.

  })
  .catch(function(error) {

    // An error occurred opening the session.

  });
```

### TODOs

- Provide all links and link-templates in top-level resource.
