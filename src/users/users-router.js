const express = require("express");
const path = require("path");
const logger = require("../logger");
const UserService = require("./users-service");
const xss = require("xss");
const { validateBearerToken } = require("../middleware/basic-auth");
const { requireAuth } = require("../middleware/jwt-auth");

const usersRouter = express.Router();
const bodyParser = express.json();

usersRouter
  .route("/")
  // Check api token
  .all(validateBearerToken)
  // return all users
  .get((req, res, next) => {})
  // Registration -> add user to database
  .post(bodyParser, (req, res, next) => {});

usersRouter
  .route("/:user_id")
  // Check api token
  .all(requireAuth)
  // Perform validation on requests
  .all((req, res, next) => {})
  // Return user by :user_id
  .get((req, res, next) => {})
  // Remove user from database -> wired up but not used in client yet
  .delete((req, res, next) => {})
  // Edit user in database -> wired up but not used in client yet
  .patch(bodyParser, (req, res, next) => {});
