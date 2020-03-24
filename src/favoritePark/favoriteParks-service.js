// Perform CRUD operations on the favorite_parks table in the database
const FavoriteParksService = {
  // Retrieve all favorites from the database
  getAllFavorites(knex) {
    return knex.select("*").from("favorite_parks");
  },
  // Add a favorite park to the database
  insertFavorite(knex, favorite) {
    return knex
      .insert(favorite)
      .into("favorite_parks")
      .returning("*")
      .then(rows => {
        return rows[0];
      });
  },
  // Get favorite by favorite_parks id
  getById(knex, id) {
    return knex
      .from("favorite_parks")
      .select("*")
      .where("id", id)
      .first();
  },
  // Get all favorite_parks by user_account
  getByUserId(knex, user_account) {
    return knex
      .from("favorite_parks")
      .select("*")
      .where("user_account", user_account);
  },
  // Find favorite park by id and then delete
  deleteFavorite(knex, id) {
    return knex
      .from("favorite_parks")
      .where({ id })
      .delete();
  },
  // Find favorite park by id and then update it
  editFavorite(knex, id, updateFields) {
    return knex
      .from("favorite_parks")
      .where({ id })
      .update(updateFields);
  },
  serializeFavorite(favorite) {
    return {
      id: favorite.id,
      userAccount: favorite.user_account,
      parkCode: favorite.park_code,
      favorite: favorite.favorite
    };
  }
};

module.exports = FavoriteParksService;
