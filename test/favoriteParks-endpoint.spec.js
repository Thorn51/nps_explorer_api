const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const { makeUsersArray, makeFavoriteParksArray } = require("./fixtures");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

describe.only("Favorite Parks Endpoints", () => {
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

  describe.only("GET /api/favorite/:favorite_id", () => {
    const testUsers = makeUsersArray();
    // Insert users here to make the authorization header
    before("Insert users", () => {
      return db("users").insert(prepUsers(testUsers));
    });
    context("No data in comments table", () => {
      it("Returns error 404", () => {
        const noCommentId = 200;
        return supertest(app)
          .get(`/api/favorites/${noCommentId}`)
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
});
