const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const {
  makeCommentsArray,
  makeFavoriteParksArray,
  makeUsersArray
} = require("./fixtures");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

describe.only("Protected Endpoints", () => {
  let db;

  before("Make knex instance with test database", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL
    });
    app.set("db", db);
  });

  after("Disconnect from test database", () => db.destroy());

  before("Remove data from tables", () =>
    db.raw("TRUNCATE favorite_parks, comments, users RESTART IDENTITY CASCADE")
  );

  afterEach("Remove data from tables", () =>
    db.raw("TRUNCATE favorite_parks, comments, users RESTART IDENTITY CASCADE")
  );

  function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
    const token = jwt.sign({ user_id: user.id }, secret, {
      subject: user.email,
      algorithm: "HS256"
    });
    return `Bearer ${token}`;
  }

  function prepUsers(testUsers) {
    const preppedUsers = testUsers.map(user => ({
      ...user,
      password: bcrypt.hashSync(user.password)
    }));
    return preppedUsers;
  }

  describe("Test all endpoints for authorization", () => {
    const testUsers = makeUsersArray();
    const testComments = makeCommentsArray();
    const testFavorites = makeFavoriteParksArray();

    beforeEach("Insert data", () => {
      return db("users")
        .insert(prepUsers(testUsers))
        .then(() => {
          return db
            .into("comments")
            .insert(testComments)
            .then(() => {
              return db.into("favorite_parks").insert(testFavorites);
            });
        });
    });

    const protectedEndpoints = [
      {
        name: "GET /api/comments",
        path: "/api/comments",
        method: supertest(app).get
      },
      {
        name: "GET /api/comments/:comment_id",
        path: "/api/comments/1",
        method: supertest(app).get
      },
      {
        name: "POST /api/comments",
        path: "/api/comments",
        method: supertest(app).post
      },
      {
        name: "DELETE /api/comments/:comment_id",
        path: "/api/comments/1",
        method: supertest(app).delete
      },
      {
        name: "PATCH /api/comments/:comment_id",
        path: "/api/comments/1",
        method: supertest(app).patch
      },
      {
        name: "GET /api/favorites",
        path: "/api/favorites",
        method: supertest(app).get
      },
      {
        name: "GET /api/favorites/favorite_:id",
        path: "/api/favorites/1",
        method: supertest(app).get
      },
      {
        name: "POST /api/favorites",
        path: "/api/favorites",
        method: supertest(app).post
      },
      {
        name: "DELETE /api/favorites/:favorite_id",
        path: "/api/favorites/1",
        method: supertest(app).delete
      },
      {
        name: "PATCH /api/favorites/:favorite_id",
        path: "/api/comments/1",
        method: supertest(app).patch
      },
      {
        name: "GET /api/users",
        path: "/api/users",
        method: supertest(app).get
      },
      {
        name: "GET /api/users/user_:id",
        path: "/api/users/1",
        method: supertest(app).get
      },
      {
        name: "POST /api/users",
        path: "/api/users",
        method: supertest(app).post
      },
      {
        name: "DELETE /api/users/:user_id",
        path: "/api/users/1",
        method: supertest(app).delete
      },
      {
        name: "PATCH /api/users/:user_id",
        path: "/api/users/1",
        method: supertest(app).patch
      }
    ];

    protectedEndpoints.forEach(endpoint => {
      describe(endpoint.name, () => {
        it(`Returns status 401 'Unauthorized request'`, () => {
          return endpoint
            .method(endpoint.path)
            .expect(401, { error: "Unauthorized request" });
        });
        it("responds with status 401 'Unauthorized request' invalid JWT secret", () => {
          const validUser = testUsers[0];
          const invalidSecret = "Invalid";
          return endpoint
            .method(endpoint.path)
            .set("Authorization", makeAuthHeader(validUser, invalidSecret))
            .expect(401, { error: "Unauthorized request" });
        });
        it("responds with status 401 'Unauthorized request' when invalid sub in payload", () => {
          const userInvalidCredentials = {
            email: "Invalid",
            id: 1
          };
          return endpoint
            .method(endpoint.path)
            .set("Authorization", makeAuthHeader(userInvalidCredentials))
            .expect(401, { error: "Unauthorized request" });
        });
      });
    });
  });
});
