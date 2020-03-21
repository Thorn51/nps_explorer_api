const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { makeUsersArray, makeXssUser } = require("./fixtures");

describe.only("/api/users Endpoints", () => {
  let db;

  before(
    "Create knex instance -> connect to nps_explorer_test database",
    () => {
      db = knex({
        client: "pg",
        connection: process.env.TEST_DATABASE_URL
      });
      app.set("db", db);
    }
  );

  after("Disconnect from nps_explorer_test", () => db.destroy());

  before("Clean table", () =>
    db.raw("TRUNCATE favorite_parks, comments, users RESTART IDENTITY CASCADE")
  );

  function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
    const token = jwt.sign({ userId: user.id }, secret, {
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

  describe("GET /api/users", () => {
    context("No data in users table", () => {
      it("Returns an empty array and status 200", () => {
        return supertest(app)
          .get("/api/users")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(200, []);
      });
    });

    context("Data in the users table", () => {
      const testUsers = makeUsersArray();

      beforeEach("Insert test data", () => {
        return db("users").insert(prepUsers(testUsers));
      });

      it("GET /api/users responds with status 200 and all of the users", () => {
        return supertest(app)
          .get("/api/users")
          .set("Authorization", "bearer " + process.env.API_TOKEN)
          .expect(200)
          .then(res => {
            expect(res.body.first_name).to.eql(testUsers.first_name);
            expect(res.body.last_name).to.eql(testUsers.last_name);
            expect(res.body.email).to.eql(testUsers.email);
            expect(res.body.nickname).to.eql(testUsers.nickname);
            expect(res.body.home_state).to.eql(testUsers.home_state);
          });
      });
    });
  });
});
