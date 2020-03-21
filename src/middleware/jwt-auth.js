const AuthService = require("../auth/auth-service");

// Validate the JWT
function requireAuth(req, res, next) {
  const authToken = req.get("Authorization") || "";
  let bearerToken;
  if (!authToken.toLowerCase().startWith("bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  } else {
    bearerToken = authToken.slice(7, authToken.length);
  }
  try {
    const payload = AuthService.verifyJwt(bearerToken);

    AuthService.getUserWithUsername(req.app.get("db"), payload.sub)
      .then(user => {
        if (!user) {
          return res.status(401).json({ error: "Unauthorized request" });
        }
        req.user = user;
        next();
      })
      .catch(err => {
        console.log(err);
        next(err);
      });
  } catch (error) {
    res.status(401).json({ error: "Unauthorized request" });
  }
}
