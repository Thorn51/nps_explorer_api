const AuthService = require("../auth/auth-service");
const logger = require("../logger");

// Check basic authorization

function requireAuth(req, res, next) {
  const authToken = req.get("Authorization") || "";
  let basicToken;

  if (!authToken.toLowerCase().startsWith("basic ")) {
    return res.status(401).json({ error: "Missing basic token" });
  } else {
    basicToken = authToken.slice("basic ".length, authToken.length);
  }

  const [tokenEmail, tokenPassword] = Buffer.from(basicToken, "base64")
    .toString()
    .split(":");

  if (!tokenEmail || !tokenPassword) {
    return res.status(401).json({ error: "Unauthorized request" });
  }

  AuthService.getUserWithUsername(req.app.get("db"), tokenEmail).then(user => {
    if (!user) {
      logger.error("User was not found");
      return res.status(401).json({ error: "Unauthorized request" });
    }

    return AuthService.comparePasswords(tokenPassword, user.password).then(
      passwordsMatch => {
        if (!passwordsMatch) {
          logger.error("Passwords did not match");
          return res.status(401).json({ error: "Unauthorized request" });
        }

        req.user = user;
        next();
      }
    );
  });
}

// Check to ensure that the client has submitted the API token
function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_Token;
  const clientToken = req.get("Authorization");

  if (!clientToken || clientToken.split(" ")[1] !== apiToken) {
    logger.error("The client API token is missing or incorrect");
    return res.status(401).json({ error: "Unauthorized request" });
  }

  next();
}
