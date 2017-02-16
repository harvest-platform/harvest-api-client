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

const client = new Client({
  url: 'http://harvest.research.chop.edu/demo/api/'
});

// Call a method on one of the APIs. This returns a promise
// that resolves by passing in the data for that call.
client.categories.all()
  .then(function(data) {
    data.forEach(function(category) {
      console.log(category);
    });
  })
```

## API

### Client

Initialize the client. If authentication is required supply a `token` or `username` and `password`.

```js
const client = new Client({
  token: string?,
  username: string?,
  password: string?
});
```

### Categories

```js
// Fetch all categories.
client.categories.all();
```

### Concepts

```js
// Fetch all concepts.
client.concepts.all();

// Return all "queryable" concepts.
client.concepts.queryable();

// Return all "viewable" concepts.
client.concepts.viewable();

// Search concepts by keyword.
client.concepts.search({
  query: string
});

// Get a concept by id.
client.concepts.get({
  id: integer
});
```

### Fields

```js
// Fetch all fields.
client.fields.all();
```

### Contexts

```js
// Fetch all contexts.
client.contexts.all();

// Get a context by id.
client.contexts.get({
  id: integer
});
```

### Views

```js
// Fetch all views.
client.views.all();

// Get a view by id.
client.views.get({
  id: integer
});
```

### Queries

```js
// Fetch all queries.
client.queries.all();

// Fetch all public queries.
client.queries.public();

// Get a query by id.
client.queries.get({
  id: integer
});
```

### Data

```js
// Fetch a page of data for the specified context and view.
client.data.preview({
  page: integer?,
  limit: integer?,
  context: object?,
  view: object?
});

// Export and download data for a query into the specified format.
client.data.export({
  format: string,
  context: object?,
  view: object?
});
```

### Stats

```js
// Fetch all model counts.
client.stats.counts();
```

## TODOs

- Serrano: provide all links and link-templates in top-level resource.
