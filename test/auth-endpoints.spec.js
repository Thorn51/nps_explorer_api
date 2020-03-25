const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const { makeUsersArray } = require("./fixtures");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

describe.only("Auth Endpoints", () => {
  let db;

  const testUsers = makeUsersArray();
  const testUser = testUsers[0];

  function prepUsers(testUsers) {
    const preppedUsers = testUsers.map(user => ({
      ...user,
      password: bcrypt.hashSync(user.password)
    }));
    return preppedUsers;
  }

  const preppedTestUsers = prepUsers(testUsers);

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("Clean table", () =>
    db.raw(`TRUNCATE favorite_parks, comments, users RESTART IDENTITY CASCADE`)
  );

  before("Clean table", () =>
    db.raw(`TRUNCATE favorite_parks, comments, users RESTART IDENTITY CASCADE`)
  );

  afterEach("Remove data after each test", () =>
    db.raw(`TRUNCATE favorite_parks, comments, users RESTART IDENTITY CASCADE`)
  );

  describe("POST /api/auth/login", () => {
    beforeEach("insert users", () => {
      return db("users").insert(preppedTestUsers);
    });

    const requiredFields = ["email", "password"];

    requiredFields.forEach(field => {
      const loginAttemptBody = {
        email: testUser.email,
        password: testUser.password
      };

      it(`responds with status 400 required error when '${field}' is missing`, () => {
        delete loginAttemptBody[field];

        return supertest(app)
          .post("/api/auth/login")
          .send(loginAttemptBody)
          .expect(400, { error: `Missing '${field}' in request body` });
      });
    });

    it("responds with status 400 'invalid user_name or password' when bad user-name or password", () => {
      const invalidUser = {
        email: "invalid@invalid.com",
        password: "Invalid1!"
      };
      return supertest(app)
        .post("/api/auth/login")
        .send(invalidUser)
        .expect(400, { error: "Incorrect username or password" });
    });

    it("responds with status 400 'invalid username or password' when bad password", () => {
      const invalidPassword = {
        email: testUser.email,
        password: "Invalid1!"
      };
      return supertest(app)
        .post("/api/auth/login")
        .send(invalidPassword)
        .expect(400, { error: "Incorrect username or password" });
    });

    it("responds with status 200 and jwt auth token using secret when valid credentials", () => {
      const userValidCredentials = {
        email: testUser.email,
        password: testUser.password
      };

      const expectedToken = jwt.sign(
        {
          userId: testUser.id,
          firstName: testUser.first_name
          //   nickname: testUser.nickname,
          //   homeSate: testUser.home_state
        }, //payload
        process.env.JWT_SECRET,
        {
          subject: testUser.email,
          algorithm: "HS256"
        }
      );

      return supertest(app)
        .post("/api/auth/login")
        .send(userValidCredentials)
        .expect(200, {
          authToken: expectedToken
        });
    });
  });
});
