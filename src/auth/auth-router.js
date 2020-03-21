const express = require("express");
const AuthService = require("./auth-service");
const logger = require("../logger");

const authRouter = express.Router();
const bodyParser = express.json();

// Router for the login endpoint
authRouter.post("/login", bodyParser, (req, res, next) => {
  const { email, password } = req.body;
  const loginUser = { email, password };

  for (const [key, value] of Object.entries(loginUser))
    if (value == null) {
      logger.error(`POST /api/auth/login -> missing ${key} in request body`);
      return res.status(400).json({
        error: `Missing '${key}' in request body`
      });
    }

  // Check the database for user
  AuthService.getUserWithUsername(req.app.get("db"), loginUser.email)
    .then(dbUser => {
      if (!dbUser) {
        logger.error(`POST  /api/auth/login -> email does not exist`);
        return res.status(400).json({
          error: "Incorrect username or password"
        });
      }
      // if the user is found then validate password
      return AuthService.comparePasswords(
        loginUser.password,
        dbUser.password
      ).then(matchPasswords => {
        if (!matchPasswords) {
          logger.error(`POST /api/auth/lgoin -> incorrect password`);
          return res.status(400).json({
            error: "Incorrect username or password"
          });
        }
        logger.info(
          `POST /api/auth/login -> user id ${dbUser.id} login successful`
        );

        // Create TWT and send in response. Payload information is useable in client, so if you need more add it. May need to come back and add the state the user is from if I decide to go that
        const sub = dbUser.email;
        const payload = { user_id: dbUser.id, first_name: dbUser.first_name };
        res.send({
          authToken: AuthService.createJwt(sub, payload)
        });
      });
    })
    .catch(next);
});

module.export = authRouter;
