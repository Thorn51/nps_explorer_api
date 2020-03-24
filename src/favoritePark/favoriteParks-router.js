const express = require("express");
const path = require("path");
const logger = require("../logger");
const FavoriteParksService = require("./favoriteParks-service");
const { requireAuth } = require("../middleware/jwt-auth");

const favoriteParksRouter = express.Router();
const bodyParser = express.json;

favoriteParksRouter
  .get("/")
  .all(requireAuth)
  // return all favorites
  .get((req, res, next) => {})
  // Create new favorite and add to favorite_parks table
  .post(bodyParser, (req, res, next) => {});

favoriteParksRouter
  .get("/favorite_id")
  .all(requireAuth)
  // Perform validation on all
  .all((req, res, next) => {})
  // Return the favorite by its id
  .get((req, res) => {})
  // Remove favorite park from table -> Not wired up in client
  .delete((req, res, next) => {})
  // Change the boolean value of favorite
  .patch(bodyParser, (req, res, next) => {});

module.exports = favoriteParksRouter;
