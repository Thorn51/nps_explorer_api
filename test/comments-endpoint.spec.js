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

  describe("GET /api/comments/:comment_id", () => {
    const testUsers = makeUsersArray();
    before("Insert users for auth header", () => {
      return db("users").insert(prepUsers(testUsers));
    });
    context("No data in comments table", () => {
      it("Returns error 404", () => {
        const noCommentId = 200;
        return supertest(app)
          .get(`/api/comments/${noCommentId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404, { error: `Comment doesn't exist` });
      });
    });

    context("Data comments table", () => {
      const testUsers = makeUsersArray();
      const testComments = makeCommentsArray();

      beforeEach("Insert users then comments (foreign key constraint)", () => {
        return db("users")
          .insert(prepUsers(testUsers))
          .then(() => {
            return db.into("comments").insert(testComments);
          });
      });

      it("GET /api/comments/:comment_id returns 200 and comment", () => {
        const queryId = 3;
        const expectedComment = testComments[queryId - 1];
        return supertest(app)
          .get(`/api/comments/${queryId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200)
          .then(res => {
            expect(res.body.id).to.eql(expectedComment.id);
            expect(res.body.authorName).to.eql(expectedComment.author_name);
            expect(res.body.authorId).to.eql(expectedComment.author_id);
            expect(res.body.commentText).to.eql(expectedComment.comment_text);
            expect(res.body.parkCode).to.eql(expectedComment.park_code);
          });
      });
    });

    context("Given an XSS attack comment", () => {
      const testUsers = makeUsersArray();
      const xssComment = makeXssComment();

      beforeEach("Insert user then comments (foreign key constraint)", () => {
        return db("users")
          .insert(prepUsers(testUsers))
          .then(() => {
            return db.into("comments").insert(xssComment);
          });
      });

      it("removes XSS content", () => {
        return supertest(app)
          .get(`/api/comments/${xssComment[0].id}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200)
          .expect(res => {
            expect(res.body.commentText).to.eql(
              '&lt;script&gt;alert("xss");&lt;/script&gt;'
            );
          });
      });
    });
  });

  describe.only("DELETE /api/comments/:comment_id", () => {
    const testUsers = makeUsersArray();
    context("no data in the comments table", () => {
      before("insert users for auth header", () => {
        return db("users").insert(prepUsers(testUsers));
      });
      it("Returns status 404", () => {
        const commentId = 123654;
        return supertest(app)
          .delete(`/api/comments/${commentId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404, { error: `Comment doesn't exist` });
      });
    });

    context("Insert users then comments -> foreign key constraint", () => {
      const testUsers = makeUsersArray();
      const testComments = makeCommentsArray();

      beforeEach("Insert test data", () => {
        return db("users")
          .insert(prepUsers(testUsers))
          .then(() => {
            return db.into("comments").insert(testComments);
          });
      });

      it("Returns status 204 and removes comment", () => {
        const commentIdToRemove = 3;
        const expectedComments = testComments.filter(
          comment => comment.id !== commentIdToRemove
        );
        return supertest(app)
          .delete(`/api/comments/${commentIdToRemove}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(204)
          .then(res => {
            expect(res.body.id).to.eql(expectedComments.id);
            expect(res.body.authorName).to.eql(expectedComments.author_name);
            expect(res.body.authorId).to.eql(expectedComments.author_id);
            expect(res.body.commentText).to.eql(expectedComments.comment_text);
            expect(res.body.parkCode).to.eql(expectedComments.park_code);
          });
      });
    });
  });
});
