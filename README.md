# National Park Explorer API

The National Park Explorer API was developed as a capstone project in the Thinkful Engineering Flex program.

## Summary

This API was created to serve the [National Park Explorer client](https://github.com/Thorn51/nps_explorer_client). The API provides services to perform CRUD operations on a PostgreSQL database. A summary of the endpoints and example of data can be found below.

The API is deployed to Heroku.

## Authorization

All of the endpoints in the National Park Explorer API are routed through authorization middleware. The first level of authorization requires a basic token. At this point, there is no mechanism in place to generate and share API tokens for use with the API.

The second level of authorization middleware creates a JSON Web Token (JWT) after a successful login. All endpoints below will indicate the type of authorization required to successfully perform CRUD operations on the database.

# Endpoints

Scheme `HTTPS`

`[ Base URL: https://boiling-anchorage-66066.herokuapp.com/]`

## Comments

Methods

`GET` || `POST` || `DELETE` || `PATCH`

### `GET` /api/comments

Request all of the comments. Requires basic token for authorization.

**Request**

    GET /api/comments
    Authorization: API Token

**Response**

    Status 200 Ok

    [
        {
        "id": 1,
        "commentText": "Bent's Old Fort is an 1833 fort located in Otero County in southeastern Colorado, United States.",
        "authorId": 1,
        "authorName": "Demo",
        "parkCode": "beol",
        "dateSubmitted": "2020-03-25T20:09:42.774Z"
    },
    {
        "id": 2,
        "commentText": "Some amazaing fishing.",
        "authorId": 1,
        "authorName": "Demo",
        "parkCode": "blca",
        "dateSubmitted": "2020-03-25T21:19:14.708Z"
    },
    {
        "id": 3,
        "commentText": "Santa Fe Trail Encampment*\nJune 5-7, 2020\n\nOne of the park’s main living history events for the year will feature historic interpretations of the Santa Fe Trail with a focus on the summer of 1843. Tensions are rising as raiders sanctioned by the Republic of Texas are raiding Mexican caravans along the trail. Experience the hey-day of the trail through ongoing demonstrations.",
        "authorId": 1,
        "authorName": "Demo",
        "parkCode": "beol",
        "dateSubmitted": "2020-03-27T12:02:35.924Z"
    }
    ]

**Request Error**

Request fails due to missing authorization basic token in header.

    Status 401 Unauthorized

    { error: "Unauthorized request" }

### `POST` /api/comments

Submit a new comment. Requires JWT for authorization middleware.

**Request Body Requirements**

- "commentText"
- "parkCoce"

**Request**

    POST /api/ideas
    Authorization: JWT
    Request Body:
        {
            "commentText": "Test documentation.",
            "parkCode": "dnoex"
        }

**Response**

    Status 201 Created

    {
        "id": 10,
        "commentText": "Test documentation.",
        "authorId": 1,
        "authorName": "Demo",
        "parkCode": "dnoex",
        "dateSubmitted": "2020-04-03T17:21:24.170Z"
    }

**Request Error**

Request fails without JWT.

    Status 401 Unauthorized

    {
        "error": "Unauthorized request"
    }

Request fails when commentText missing in request body.

    Status 400 Bad request

    {
        "error": {
            "message": "Missing 'commentText' in request body."
        }
    }

Request fails when parkCode missing in request body.

    Status 400 Bad request

    {
        "error": {
            "message": "Missing 'parkCode' in request body."
        }
    }

### `GET` /api/comments/:id

Get a comment using the comment id. Requires JWT for authorization middleware.

**Required URL Parameters**

`id=[integer]`

**Request**

    GET /api/comments/10
    Authorization: JWT

**Response**

    Status 200 Ok

    {
        "id": 10,
        "commentText": "Test documentation.",
        "authorId": 1,
        "authorName": "Demo",
        "parkCode": "dnoex",
        "dateSubmitted": "2020-04-03T17:21:24.170Z"
    }

**Response Error**

Request fails without JWT.

    Status 401 Unauthorized

    {
        "error": "Unauthorized request"
    }

Request fails when the idea doesn't exist.

    Status 404 Not Found

    {
        "error": {
            "message": "Comment doesn't exist"
        }
    }

### `DELETE` /api/comments/:id

Remove an comment from the database. Requires JWT for authorization middleware.

**Required URL Parameters**

`id=[integer]`

**Request**

    DELETE /api/comments/10
    Authorization: JWT

**Response**

    Status - 204 No Content

**Response Error**

Request fails without JWT.

    Status 401 Unauthorized

    {
        "error": "Unauthorized request"
    }

Request fails when the comment doesn't exist.

    Status 404 Not Found

    {
        "error": {
            "message": "Comment doesn't exist"
        }
    }

### `PATCH` /api/comments/:id

Edit a comment in the database. Requires JWT for authorization middleware.

**Required URL Parameters**

`id=[integer]`

**Request Body Requirements**
The request body must contain one or all of the editable fields.

- parkCode
- comment

**Request**

    PATCH /api/comments/10
    Authorization: JWT
    Request Body:
        {
            "project_title": "Documentation Title Patch"
        }

**Response**

    Status 200

    { info: "Request completed" }

**Response Error**

Request fails without JWT.

    Status 401 Unauthorized

    {
        "error": "Unauthorized request"
    }

Request fails when the idea doesn't exist.

    Status 404 Not Found

    {
        "error": {
            "message": "Comment doesn't exist"
        }
    }

Request fails when required field is missing from request body.

    {
        "error": {
            "message": "Request body must contain commentTex and or parkCode"
        }
    }

# Scripts

- `npm start` - Starts the server in local development mode.
- `npm run dev` - Starts the server with [nodemon](https://www.npmjs.com/package/nodemon). Very helpful during development!
- `npm test` - Runs Mocha test files.
- `npm run migrate` - Uses postgrator to build out tables in the database.
- `npm run migrate:test` - Uses postgrator to build tables in a test database. The test database is used during integration testing.
- `npm run migrate:production` - Build database tables in Heroku.
- `npm run deploy` - Deploys to Heroku.

# Technologies

- Node.js
- Express
- PostgreSQL
- Bcrypt
- JWT
- Winston Logger
- XSS
