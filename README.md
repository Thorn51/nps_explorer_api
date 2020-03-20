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

`[ Base URL: https://build-wine-seven.now.sh/]`

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
        "id": 12,
        "project_title": "Testing",
        "project_summary": "Testing on firefox",
        "date_submitted": "2020-02-19T00:10:26.260Z",
        "status": "Idea",
        "github": "",
        "votes": "1",
        "author": 2
        },
        {
        "id": 1,
        "project_title": "Legislative Agenda ",
        "project_summary": "A place where citizens can vote and comment on the activities of congress. Constituents can provide their feedback on legislation, so their voice is heard in Congress.\n\nFeatures \nList of all legislation that users can read summaries, full bill, arguments for or against. Then the user can vote and comment on the legislation.",
        "date_submitted": "2020-02-11T00:56:32.690Z",
        "status": "Idea",
        "github": "",
        "votes": "2",
        "author": 2
        }
    ]

**Request Error**

Request fails due to missing authorization basic token in header.

    Status 401 Unauthorized

    { error: "Unauthorized request" }

### `POST` /api/ideas

Submit a new idea. Requires JWT for authorization middleware.

**Request Body Requirements**

- "project_title"
- "project_summary"

**Request**

    POST /api/ideas
    Authorization: JWT
    Request Body:
        {
            "project_title": "Documentation",
            "project_summary": "Writing the documentation for the API."
        }

**Response**

    Status 201 Created

    {
        "id": 13,
        "project_title": "Documentation",
        "project_summary": "Writing the documentation for the API.",
        "date_submitted": "2020-02-19T20:03:58.787Z",
        "github": "",
        "votes": "0",
        "status": "Idea",
        "author": 2
    }

**Request Error**

Request fails without JWT.

    Status 401 Unauthorized

    {
        "error": "Unauthorized request"
    }

Request fails when project_title missing in request body.

    Status 400 Bad request

    {
        "error": {
            "message": "Missing 'project_title' in request body."
        }
    }

Request fails when project_summary missing in request body.

    Status 400 Bad request

    {
        "error": {
            "message": "Missing 'project_summary' in request body."
        }
    }

### `GET` /api/comments/:id

Get a comment using the comment id. Requires JWT for authorization middleware.

**Required URL Parameters**

`id=[integer]`

**Request**

    GET /api/comments/13
    Authorization: JWT

**Response**

    Status 200 Ok

    {
        "id": 13,
        "project_title": "Documentation",
        "project_summary": "Writing the documentation for the API.",
        "date_submitted": "2020-02-19T20:03:58.787Z",
        "github": "",
        "votes": "0",
        "status": "Idea",
        "author": 2
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
            "message": "Idea doesn't exist"
        }
    }

### `DELETE` /api/comments/:id

Remove an comment from the database. Requires JWT for authorization middleware.

**Required URL Parameters**

`id=[integer]`

**Request**

    DELETE /api/comments/13
    Authorization: JWT

**Response**

    Status - 204 No Content

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
            "message": "Idea doesn't exist"
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
- status

**Request**

    PATCH /api/comments/13
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
            "message": "Idea doesn't exist"
        }
    }

Request fails when required field is missing from request body.

    {
        "error": {
            "message": "Request body must contain project_title, project_summary, status, and or votes"
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
