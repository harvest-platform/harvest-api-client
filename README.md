# Cilantro

This is a work-in-progress rewrite of the Cilantro client. The rewrite includes:

- Porting views to React components
- Removing the entire model layer in favor of Redux
- Explicit plugin/extension system to make it easy to customize builds
- Generally removing cruft and unused code

## Progress

### Client
The API client code for interacting with Serrano.

- [ ] Auth/Session
- [ ]

#### Query
- [ ] Contexts

#### Metadata
- [ ] Concepts
- [ ] Fields
- [ ] Queries
- [ ] Public Queries
- [ ] Model Stats

#### Data
- [ ] Views
- [ ] Data Preview
- [ ] Export Options

### Components
The components that are ported from Marionette views.

- [ ] Query Concept List
- [ ] Query Concept Control

### Other

- [x] Config
- [ ] Lifecycle events
- [ ] Session events


## Usage

- All remote calls return promises.
- Each level of the API is accessed through objects.

```js
import Client from 'cilantro'

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
-
