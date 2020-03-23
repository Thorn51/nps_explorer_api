const express = require("express");
const path = require("path");
const logger = require("../logger");
const CommentsService = require("./comments-service");
const { requireAuth } = require("../middleware/jwt-auth");

const commentsRouter = express.Router();
const bodyParser = express.json();

commentsRouter
  .route("/")
  .all(requireAuth)
  // Return all comments from the database
  .get((req, res, next) => {
    CommentsService.getAllComments(req.app.get("db"))
      .then(comments => {
        res.json(comments.map(CommentsService.serializeComment));
        logger.info("GET /api/comments -> All comments returned");
      })
      .catch(next);
  })
  // Receive and store comments from the client
  .post(bodyParser, (req, res, next) => {
    const { commentText, parkCode } = req.body;
    const newComment = {
      comment_text: commentText,
      park_code: parkCode
    };

    for (const field of ["commentText", "authorId", "authorName", "parkCode"])
      if (!req.body[field]) {
        logger.error(
          `POST /api/comments -> missing '${field}' in request body`
        );
        return res
          .status(400)
          .json({ error: `Missing '${field}' in request body` });
      }

    newComment.author_id = req.user.id;
    newComment.author_name = req.user.first_name;

    CommentsService.insertComment(req.app.get("db"), newComment)
      .then(comment => {
        logger.info(`POST /api/comments -> Comment id ${comment.id} created`);
        res
          .status(200)
          .location(path.posix.join(req.originalUrl, `/${comment.id}`))
          .json(CommentsService.serializeComment(comment));
      })
      .catch(next);
  });

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

module.exports = commentsRouter;
