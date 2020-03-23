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

    if (!commentText) {
      logger.error(
        `POST /api/comments -> missing 'commentText' in request body`
      );
      return res
        .status(400)
        .json({ error: `Missing 'commentText' in request body` });
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
  // Perform validation on all
  .all((req, res, next) => {
    const { comment_id } = req.params;

    CommentsService.getById(req.app.get("db"), comment_id)
      .then(comment => {
        if (!comment) {
          logger.error(
            `GET /api/comments/:comment_id-> Comment id ${comment_id} doesn't exist`
          );
          return res.status(404).json({ error: `Comment doesn't exist` });
        }
        res.comment = comment;
        next();
      })
      .catch(next);
  })
  // Get a comment from database by the comment id
  .get((req, res) => {
    res.status(200).json(CommentsService.serializeComment(res.comment));
    logger.info(
      `GET /api/comments/:comment_id -> Comment id ${res.comment.id} returned`
    );
  })
  // Remove a comment from the database by the comment id
  .delete((req, res, next) => {
    const { comment_id } = req.params;

    CommentsService.deleteComment(req.app.get("db"), comment_id).then(() => {
      res.status(204).end();
      logger.info(`DELETE/api/comments -> Comment id ${comment_id} removed`);
    });
  })
  // Edit a comment in the database by the comment id
  .patch(bodyParser, (req, res, next) => {});

module.exports = commentsRouter;
