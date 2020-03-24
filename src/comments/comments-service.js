const xss = require("xss");

// Perform CRUD operations on the comments table in the database
const CommentsService = {
  // Retrieve all comments from the database
  getAllComments(knex) {
    return knex.select("*").from("comments");
  },
  // Add a comment to the database
  insertComment(knex, newComment) {
    return knex
      .insert(newComment)
      .into("comments")
      .returning("*")
      .then(rows => {
        return rows[0];
      });
  },
  // Find comment by id and then return it
  getById(knex, id) {
    return knex
      .from("comments")
      .select("*")
      .where("id", id)
      .first();
  },
  // Find comment by id and then delete
  deleteComment(knex, id) {
    return knex
      .from("comments")
      .where({ id })
      .delete();
  },
  // Find comment by id and then update it
  editComment(knex, id, updateFields) {
    return knex
      .from("comments")
      .where({ id })
      .update(updateFields);
  },
  // SECURITY  -> Remove xss content from comments submitted through the client
  serializeComment(comment) {
    return {
      id: comment.id,
      commentText: xss(comment.comment_text),
      authorId: comment.author_id,
      authorName: comment.author_name,
      parkCode: comment.park_code,
      dateSubmitted: comment.date_submitted
    };
  }
};

module.exports = CommentsService;
