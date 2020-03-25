const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  makeUsersArray,
  makeXssUser,
  makeFavoriteParksArray
} = require("./fixtures");

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

  describe("GET /api/users/favorites/:user_account", () => {
    context("No data", () => {
      const testUsers = makeUsersArray();
      // Insert users here to make the authorization header
      before("Insert users", () => {
        return db("users").insert(prepUsers(testUsers));
      });
      it("Returns status 200 and empty array", () => {
        const userAccountId = 1;
        return supertest(app)
          .get(`/api/users/favorites/${userAccountId}`)
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

      it("GET /api/users/favorites/:user_account returns status 200 and all users favorites", () => {
        const userAccount = 1;
        return supertest(app)
          .get(`/api/users/favorites/${userAccount}`)
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

  describe("GET /api/users/:user_id", () => {
    const testUsers = makeUsersArray();
    before("Insert users", () => {
      return db("users").insert(prepUsers(testUsers));
    });

    context("No user in table", () => {
      it("Responds with error 404", () => {
        const noUserId = testUsers.length + 1;
        return supertest(app)
          .get(`/api/users/${noUserId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: `User doesn't exist` } });
      });
    });

    context("Users in table", () => {
      const testUsers = makeUsersArray();

      beforeEach("Insert users", () => {
        return db("users").insert(prepUsers(testUsers));
      });

      it("GET /api/users/:user_id returns the user by id and status 200", () => {
        const getId = 1;
        const expectedUser = testUsers[getId - 1];
        return supertest(app)
          .get(`/api/users/${getId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200)
          .then(res => {
            expect(res.body.firstName).to.eql(expectedUser.first_name);
            expect(res.body.lastName).to.eql(expectedUser.last_name);
            expect(res.body.email).to.eql(expectedUser.email);
            expect(res.body).to.have.property("id");
            expect(res.body).to.have.property("dateCreated");
          });
      });
    });

    context("Given XSS content", () => {
      const xssUser = makeXssUser();

      beforeEach("Insert malicious user", () => {
        return db.into("users").insert(prepUsers(xssUser));
      });

      it("Removes XSS content", () => {
        return supertest(app)
          .get(`/api/users/${xssUser[1].id}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200)
          .expect(res => {
            expect(res.body.firstName).to.eql(
              '&lt;script&gt;alert("xss");&lt;/script&gt;'
            );
            expect(res.body.lastName).to.eql(
              '<img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.'
            );
            expect(res.body.email).to.eql(
              '&lt;script&gt;alert("xss");&lt;/script&gt;'
            );
            expect(res.body.nickname).to.eql(
              '&lt;script&gt;alert("xss");&lt;/script&gt;'
            );
          });
      });
    });
  });

  describe("DELETE /api/users/:user_id", () => {
    const testUsers = makeUsersArray();

    before("Insert users for auth header", () => {
      return db("users").insert(prepUsers(testUsers));
    });

    context("No data in table", () => {
      it("Returns status 404", () => {
        const userId = 1234;
        return supertest(app)
          .delete(`/api/users/${userId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: `User doesn't exist` } });
      });
    });

    context("Data in users table", () => {
      const testUsers = makeUsersArray();

      beforeEach("Insert users", () => {
        return db("users").insert(prepUsers(testUsers));
      });

      it("Responds with status 204 and removes the user", () => {
        const idToRemove = 2;
        const remainingUsers = testUsers.filter(user => user.id !== idToRemove);
        return supertest(app)
          .delete(`/api/users/${idToRemove}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(204)
          .then(res => {
            supertest(app)
              .get("/api/users")
              .set("Authorization", makeAuthHeader(testUsers[0]))
              .then(res => {
                expect(res.body.id).to.eql(remainingUsers.id);
              });
          });
      });
    });
  });

  describe("PATCH /api/users:user_id", () => {
    const testUsers = makeUsersArray();
    before("Insert users for auth header", () => {
      return db("users").insert(prepUsers(testUsers));
    });
    context("No data in table", () => {
      it("Returns status 400", () => {
        const userId = 1234;
        return supertest(app)
          .patch(`/api/users/${userId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404);
      });
    });

    context("Data in users table", () => {
      const testUser = makeUsersArray();

      beforeEach("Insert users", () => {
        return db("users").insert(prepUsers(testUsers));
      });

      it("Responds with status 204 and updates user", () => {
        const userToUpdate = 2;
        const updateUser = {
          firstName: "Test",
          lastName: "Patch",
          email: "test.patch@testify.com"
        };

        return supertest(app)
          .patch(`/api/users/${userToUpdate}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .send(updateUser)
          .expect(200, { info: `User with id ${userToUpdate} edited` });
      });

      it("Returns status 400 when no required fields in request body", () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/users/${idToUpdate}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .send({ irrelevantField: "Foo" })
          .expect(400, {
            error: {
              message:
                "Request body must contain firstName, lastName, email, password, and or homeState"
            }
          });
      });

      it("Returns status 204 when updating subset of fields", () => {
        const idToUpdate = 2;
        const updateUser = {
          firstName: "Testimus"
        };
        return supertest(app)
          .patch(`/api/users/${idToUpdate}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .send({
            ...updateUser,
            fieldToIgnore: "Should not be in GET response"
          })
          .expect(200, { info: `User with id ${idToUpdate} edited` });
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
        it("Responds with status 400 when invalid email submitted", () => {
          const invalidEmail = {
            firstName: "Test",
            lastName: "User",
            email: "test.usertesty.com",
            password: "testyUser1!"
          };
          return supertest(app)
            .post("/api/users")
            .set("Authorization", "bearer " + process.env.API_Token)
            .send(invalidEmail)
            .expect(400, {
              error: `Invalid email address`
            });
        });
        it("Responds with status 400 when email already in databse", () => {
          const duplicateEmail = {
            firstName: testUser.first_name,
            lastName: testUser.last_name,
            email: testUser.email,
            password: "testyUser1!"
          };
          return supertest(app)
            .post("/api/users")
            .set("Authorization", "bearer " + process.env.API_Token)
            .send(duplicateEmail)
            .expect(400, {
              error: `The email submitted is already in use.`
            });
        });
      });
    });

    context("Registration success -> status 201", () => {
      it("Responds with status 201, serialized user, strong bcrypt password", () => {
        const newUser = {
          firstName: "Test",
          lastName: "User",
          email: "test.user@testy.com",
          password: "testyUser1!"
        };
        return supertest(app)
          .post("/api/users")
          .set("Authorization", "bearer " + process.env.API_Token)
          .send(newUser)
          .expect(201)
          .expect(res => {
            expect(res.body).to.have.property("id");
            expect(res.body.firstName).to.eq(newUser.firstName);
            expect(res.body.lastName).to.eq(newUser.lastName);
            expect(res.body.email).to.eq(newUser.email);
            expect(res.body).to.not.have.property("password");
            expect(res.headers.location).to.eql(`/api/users/${res.body.id}`);
          })
          .expect(res =>
            db("users")
              .select("*")
              .where({ id: res.body.id })
              .first()
              .then(row => {
                expect(row.first_name).to.eql(newUser.firstName);
                expect(row.last_name).to.eql(newUser.lastName);
                expect(row.email).to.eql(newUser.email);
                return bcrypt.compare(newUser.password, row.password);
              })
              .then(compareMatch => {
                expect(compareMatch).to.be.true;
              })
          );
      });
    });
  });
});
