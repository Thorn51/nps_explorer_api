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

  before("Clean tables", () =>
    db.raw("TRUNCATE favorite_parks, comments, users RESTART IDENTITY CASCADE")
  );

  afterEach("Clean tables", () =>
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
          .set("Authorization", "bearer " + process.env.API_Token)
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
          .set("Authorization", "bearer " + process.env.API_Token)
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

  describe("POST /api/users", () => {
    context("User validation", () => {
      const testUsers = makeUsersArray();
      const testUser = testUsers[0];

      beforeEach("Insert users", () => {
        return db.into("users").insert(testUsers);
      });

      const requiredFields = ["firstName", "lastName", "email", "password"];

      requiredFields.forEach(field => {
        const newUser = {
          firstName: "Test",
          lastName: "User",
          email: "test.user@testy.com",
          password: "testyUser1!"
        };

        it(`Responds with status 400 when '${field}' is missing in the request body`, () => {
          delete newUser[field];

          return supertest(app)
            .post("/api/users")
            .set("Authorization", "bearer " + process.env.API_Token)
            .send(newUser)
            .expect(400, {
              error: `Missing '${field}' in request body`
            });
        });

        it("Responds with status 400 when password less than 8 characters", () => {
          const shortPassword = {
            firstName: "Test",
            lastName: "User",
            email: "test.user@testy.com",
            password: "User1!"
          };
          return supertest(app)
            .post("/api/users")
            .set("Authorization", "bearer " + process.env.API_Token)
            .send(shortPassword)
            .expect(400, {
              error: `Password must be longer than 8 characters`
            });
        });
        it("Responds with status 400 when password greater than 64 characters", () => {
          const longPassword = {
            firstName: "Test",
            lastName: "User",
            email: "test.user@testy.com",
            password: "Aa1!".repeat(17)
          };
          return supertest(app)
            .post("/api/users")
            .set("Authorization", "bearer " + process.env.API_Token)
            .send(longPassword)
            .expect(400, {
              error: `Password must be less than 64 characters`
            });
        });
        it("Responds with status 400 when password starts with space", () => {
          const spaceBeginning = {
            firstName: "Test",
            lastName: "User",
            email: "test.user@testy.com",
            password: " testyUser1!"
          };
          return supertest(app)
            .post("/api/users")
            .set("Authorization", "bearer " + process.env.API_Token)
            .send(spaceBeginning)
            .expect(400, {
              error: `Password must not start or end with empty spaces`
            });
        });
        it("Responds with status 400 when password ends with space", () => {
          const spaceEnd = {
            firstName: "Test",
            lastName: "User",
            email: "test.user@testy.com",
            password: "testyUser1! "
          };
          return supertest(app)
            .post("/api/users")
            .set("Authorization", "bearer " + process.env.API_Token)
            .send(spaceEnd)
            .expect(400, {
              error: `Password must not start or end with empty spaces`
            });
        });
        // See users-services.js PASSWORD_REGEX
        it("Responds with status 400 when password fails complexity validation", () => {
          const notComplex = {
            firstName: "Test",
            lastName: "User",
            email: "test.user@testy.com",
            password: "testyuser1"
          };
          return supertest(app)
            .post("/api/users")
            .set("Authorization", "bearer " + process.env.API_Token)
            .send(notComplex)
            .expect(400, {
              error: `Password must contain 1 upper case, lower case, number, and special character`
            });
        });
      });
    });
  });
});
