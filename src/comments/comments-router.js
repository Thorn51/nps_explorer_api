const express = require("express");
const path = require("path");
const xss = require("xss");
const logger = require("../logger");
const CommentsService = require("./comments-service");
const { requireAuth } = require("../middleware/jwt-auth");

const commentsRouter = express.Router();
const bodyParser = express.json();

// SECURITY  -> Remove xss content from comments submitted through the client
const serializeComment = comment => ({
  id: comment.id,
  text: xss(comment.comment_text),
  userId: comment.author_id,
  authorName: comment.author_name,
  parkCode: comment.park_code,
  dateSubmitted: comment.date_submitted
});

commentsRouter
  .route("/")
  .all(requireAuth)
  // Return all comments from the database
  .get((req, res, next) => {})
  // Receive and store comments from the client
  .post(bodyParser, (req, res, next) => {});

commentsRouter
  .route("/:comment_id")
  .all(requireAuth)
  .all((req, res, next) => {})
  // Get a comment from database by the comment id
  .get((req, res) => {})
  // Remove a comment from the database by the comment id
  .delete((req, res, next) => {})
  // Edit a comment in the database by the comment id
  .patch(bodyParser, (req, res, next) => {});
