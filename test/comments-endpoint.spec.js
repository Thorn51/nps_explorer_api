const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const {
  makeCommentsArray,
  makeXssComment,
  makeUsersArray
} = require("./fixtures");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

describe.only("Comments Endpoints", () => {
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

  describe("GET /api/comments", () => {
    context("No data", () => {
      const testUsers = makeUsersArray();
      before("Insert users for auth header", () => {
        return db("users").insert(prepUsers(testUsers));
      });
      it("Returns status 200 and empty array", () => {
        return supertest(app)
          .get("/api/comments")
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200, []);
      });
    });
  });

  describe("POST /api/comments", () => {
    const testUsers = makeUsersArray();

    beforeEach("Insert test data", () => {
      return db("users").insert(prepUsers(testUsers));
    });
    it("Returns status 201 and new comment", () => {
      const newComment = {
        commentText: "Testing the comments post method",
        parkCode: "yell"
      };
      return supertest(app)
        .post("/api/comments")
        .set("Authorization", makeAuthHeader(testUsers[0]))
        .send(newComment)
        .expect(201)
        .expect(res => {
          expect(res.body.commentText).to.eql(newComment.comment_text);
          expect(res.body.parkCode).to.eql(newComment.park_code);
          expect(res.body).to.have.property("author_id");
          expect(res.body).to.have.property("id");
          expect(res.body).to.have.property("author_name");
          expect(res.body).to.have.property("date_submitted");
          expect(res.headers.location).to.eql(`/api/comments/${res.body.id}`);
        });
    });

    it(`responds with status 400 when 'comment_text' is missing from request body`, () => {
      return supertest(app)
        .post("/api/comments")
        .set("Authorization", makeAuthHeader(testUsers[0]))
        .send({})
        .expect(400, {
          error: `Missing 'commentText' in the request body`
        });
    });
  });
});
