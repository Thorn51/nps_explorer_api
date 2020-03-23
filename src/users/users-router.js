const express = require("express");
const path = require("path");
const logger = require("../logger");
const UsersService = require("./users-service");
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
  .get((req, res, next) => {
    UsersService.getAllUsers(req.app.get("db"))
      .then(users => {
        res.json(users.map(UsersService.serializeUser));
      })
      .catch(next);
    logger.info(`GET /users successful`);
  })
  // Registration -> add user to database
  .post(bodyParser, (req, res, next) => {
    const {
      firstName,
      lastName,
      email,
      password,
      nickname,
      homeState
    } = req.body;

    for (const field of ["firstName", "lastName", "email", "password"])
      if (!req.body[field]) {
        logger.error(
          `POST ap/api/users -> Registration missing '${field}' in request body`
        );
        return res.status(400).json({
          error: `Missing '${field}' in request body`
        });
      }

    const passwordError = UsersService.validatePassword(password);
    const emailError = UsersService.validateEmail(email);

    if (passwordError) {
      logger.error(`POST /api/user -> ${passwordError}`);
      return res.status(400).json({ error: passwordError });
    }

    if (emailError) {
      logger.error(`POST /api/user -> ${emailError}`);
      return res.status(400).json({ error: emailError });
    }

    // Check database if email is already in use
    UsersService.hasUserWithEmail(req.app.get("db"), email).then(
      hasUserWithEmail => {
        if (hasUserWithEmail) {
          logger.error(
            `POST /api/users -> Registration attempt failed email already in database`
          );
          return res
            .status(400)
            .json({ error: "The email submitted is already in use." });
        }

        return UsersService.hashPassword(password).then(hashedPassword => {
          const newUser = {
            first_name: firstName,
            last_name: lastName,
            email,
            password: hashedPassword,
            nickname,
            home_state: homeState,
            date_created: "now()"
          };

          // Add new user to database
          return UsersService.insertUser(req.app.get("db"), newUser).then(
            user => {
              logger.info(
                `POST /api/users -> New user with id ${user.id} added to database`
              );
              res
                .status(201)
                .location(path.posix.join(req.originalUrl, `/${user.id}`))
                .json(UsersService.serializeUser(user));
            }
          );
        });
      }
    );
  });

usersRouter
  .route("/:user_id")
  // Check api token
  .all(requireAuth)
  // Get user by ID
  .all((req, res, next) => {
    UsersService.getById(req.app.get("db"), req.params.user_id)
      .then(user => {
        if (!user) {
          logger.error(
            `GET /api/users/:user_id -> user id=${req.params.user_id} not found`
          );
          return res.status(404).json({
            error: { message: "User doesn't exist" }
          });
        }
        res.user = user;
        next();
      })
      .catch(next);
  })
  // Return user by :user_id
  .get((req, res, next) => {
    res.status(200).json(UsersService.serializeUser(res.user));
    logger.info(`GET /api/users/:user_id -> user_id=${res.user.id} returned`);
  })
  // Remove user from database -> wired up but not used in client yet
  .delete((req, res, next) => {
    const { user_id } = req.params;

    UsersService.deleteUser(req.app.get("db"), user_id)
      .then(() => {
        res.status(204).end();
        logger.info(
          `DELETE /api/users/:user_id -> user with id ${user_id} removed from database`
        );
      })
      .catch(next);
  })
  // Edit user in database -> wired up but not used in client yet
  // CAUTION!!! -> Password update needs careful consideration, and perhaps its own endpoint?
  .patch(bodyParser, (req, res, next) => {
    const { firstName, lastName, email, password, homeState } = req.body;
    const userUpdate = {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      home_state: homeState
    };

    const numberOfValues = Object.values(userUpdate).filter(Boolean).length;

    if (numberOfValues === 0) {
      logger.error(
        `PATCH /api/users/:user_id -> request body did not contain relevant fields`
      );
      return res.status(400).json({
        error: {
          message:
            "Request body must contain firstName, lastName, email, password, and or homeState"
        }
      });
    }

    UsersService.updateUser(req.app.get("db"), req.params.user_id, userUpdate)
      .then(numRowsAffect => {
        logger.info(
          `PATCH /api/users/:user_id -> user id ${req.params.user_id} edited`
        );
        res.status(200).json({
          info: `User with id ${req.params.user_id} edited`
        });
      })
      .catch(next);
  });

module.exports = usersRouter;
