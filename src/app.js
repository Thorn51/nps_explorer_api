require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");
const usersRouter = require("./users/users-router");
const commentsRouter = require("./comments/comments-router");
const favoriteParksRouter = require("./favoritePark/favoriteParks-router");
const authRouter = require("./auth/auth-router");

const app = express();

app.use(helmet());
app.use(cors());

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/favorites", favoriteParksRouter);

app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === "production") {
    response = { error: { message: "server error" } };
  } else {
    console.log(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;
