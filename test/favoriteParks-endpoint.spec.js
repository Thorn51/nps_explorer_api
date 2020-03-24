const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const { makeUsersArray, makeFavoriteParksArray } = require("./fixtures");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

describe("Favorite Parks Endpoints", () => {
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
    db.raw(
      "TRUNCATE favorite_parks, favorite_parks, users RESTART IDENTITY CASCADE"
    )
  );

  afterEach("Remove data from tables", () =>
    db.raw(
      "TRUNCATE favorite_parks, favorite_parks, users RESTART IDENTITY CASCADE"
    )
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

  describe("GET /api/favorites", () => {
    context("No data", () => {
      const testUsers = makeUsersArray();
      // Insert users here to make the authorization header
      before("Insert users", () => {
        return db("users").insert(prepUsers(testUsers));
      });
      it("Returns status 200 and empty array", () => {
        return supertest(app)
          .get("/api/favorites")
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200, []);
      });
    });

    context("Data in the favorite_parks table", () => {
      const testUsers = makeUsersArray();
      const testFavorites = makeFavoriteParksArray();

      // Insert users then favorites -> foreign key constraint
      beforeEach("Insert data", () => {
        return db("users")
          .insert(prepUsers(testUsers))
          .then(() => {
            return db("favorite_parks").insert(testFavorites);
          });
      });

      it("GET /api/favorites returns status 200 and all favorites", () => {
        return supertest(app)
          .get("/api/favorites")
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200)
          .then(res => {
            expect(res.body.id).to.eql(testFavorites.id);
            expect(res.body.userAccount).to.eql(testFavorites.user_account);
            expect(res.body.parkCode).to.eql(testFavorites.park_code);
            expect(res.body.favorite).to.eql(testFavorites.favorite);
          });
      });
    });
  });

  describe("POST /api/favorites", () => {
    const testUsers = makeUsersArray();

    beforeEach("Insert test data", () => {
      return db("users").insert(prepUsers(testUsers));
    });
    it("Returns status 201 and new favorite", () => {
      const newFavorite = {
        favorite: true,
        parkCode: "yell"
      };
      return supertest(app)
        .post("/api/favorites")
        .set("Authorization", makeAuthHeader(testUsers[0]))
        .send(newFavorite)
        .expect(201)
        .expect(res => {
          expect(res.body.favorite).to.eql(newFavorite.favorite);
          expect(res.body.parkCode).to.eql(newFavorite.parkCode);
          expect(res.body).to.have.property("id");
          expect(res.body).to.have.property("userAccount");
        });
    });
  });

  describe("GET /api/favorite/:favorite_id", () => {
    const testUsers = makeUsersArray();
    // Insert users here to make the authorization header
    before("Insert users", () => {
      return db("users").insert(prepUsers(testUsers));
    });
    context("No data in favorites table", () => {
      it("Returns error 404", () => {
        const noFavoriteId = 200;
        return supertest(app)
          .get(`/api/favorites/${noFavoriteId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404, { error: `Favorite doesn't exist` });
      });
    });

    context("Data in favorites table", () => {
      const testUsers = makeUsersArray();
      const testFavorites = makeFavoriteParksArray();

      // Insert users then favorite -> foreign key constraint
      beforeEach("Insert data)", () => {
        return db("users")
          .insert(prepUsers(testUsers))
          .then(() => {
            return db.into("favorite_parks").insert(testFavorites);
          });
      });

      it("GET /api/favorites/:favorite_id returns 200 and favorite", () => {
        const queryId = 3;
        const expectedFavorites = testFavorites[queryId - 1];
        return supertest(app)
          .get(`/api/favorites/${queryId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200)
          .then(res => {
            expect(res.body.id).to.eql(expectedFavorites.id);
            expect(res.body.userAccount).to.eql(expectedFavorites.user_account);
            expect(res.body.parkCode).to.eql(expectedFavorites.park_code);
            expect(res.body.favorite).to.eql(expectedFavorites.favorite);
          });
      });
    });
  });
  describe(`DELETE /api/favorites/:favorite_id`, () => {
    const testUsers = makeUsersArray();
    context("No data in tables", () => {
      // Insert users to create the auth header
      before("Insert users", () => {
        return db("users").insert(testUsers);
      });

      it("Returns status 404", () => {
        const favoriteId = 987456;
        return supertest(app)
          .delete(`/api/favorites/${favoriteId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404, { error: `Favorite doesn't exist` });
      });
    });

    context("Data in tables", () => {
      const testUsers = makeUsersArray();
      const testFavorites = makeFavoriteParksArray();
      // Insert users then favorites -> foreign key constraint
      beforeEach("Insert data", () => {
        return db("users")
          .insert(testUsers)
          .then(() => {
            return db("favorite_parks").insert(testFavorites);
          });
      });

      it(`Returns status 204 and removes favorite`, () => {
        const favoriteToRemove = 2;
        const expectedFavorites = testFavorites.filter(
          favorite => favorite.id !== favoriteToRemove
        );
        return supertest(app)
          .delete(`/api/favorites/${favoriteToRemove}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(204);
      });
    });
  });

  describe("PATCH /api/favorites/:favorite_id", () => {
    const testUsers = makeUsersArray();
    // Add users to make auth header
    before("Insert users", () => {
      return db("users").insert(testUsers);
    });
    context("No data in tables", () => {
      it("Responds with status 404", () => {
        const badId = 765234;
        return supertest(app)
          .patch(`/api/favorites/${badId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404, { error: `Favorite doesn't exist` });
      });
    });
    context("Data in tables", () => {
      const testUsers = makeUsersArray();
      const testFavorites = makeFavoriteParksArray();
      beforeEach("Insert data", () => {
        return db("users")
          .insert(testUsers)
          .then(() => {
            return db("favorite_parks").insert(testFavorites);
          });
      });
      it("Responds with status 200 and updates favorite", () => {
        const idToUpdate = 4;
        const updatedFavorite = {
          favorite: false
        };
        const expectedComment = {
          ...testFavorites[idToUpdate - 1],
          ...updatedFavorite
        };
        return supertest(app)
          .patch(`/api/favorites/${idToUpdate}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .send(updatedFavorite)
          .expect(200, { info: "Request completed" })
          .then(() => {
            return supertest(app)
              .get(`/api/favorites/${idToUpdate}`)
              .set("Authorization", makeAuthHeader(testUsers[0]))
              .then(res => {
                expect(res.body.id).to.eql(expectedComment.id);
                expect(res.body.userAccount).to.eql(
                  expectedComment.user_account
                );
                expect(res.body.parkCode).to.eql(expectedComment.park_code);
                expect(res.body.favorite).to.eql(expectedComment.favorite);
              });
          });
      });
      it("Responds with status 400 when missing 'favorite' in request body", () => {
        const idToUpdate = 5;
        return supertest(app)
          .patch(`/api/favorites/${idToUpdate}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .send({ noSuchField: "Testing" })
          .expect(400, { error: `Request body must contain 'favorite'` });
      });
    });
  });
});
