// Perform CRUD operations on the favorite_parks table in the database
const FavoriteParksService = {
  // Retrieve all favorites from the database
  getAllFavorites(knex) {
    return knex.select("*").from("favorite_parks");
  },
  // Add a favorite park to the database
  insertComment(knex, favorite) {
    return knex
      .insert(favorite)
      .into("favorite_parks")
      .returning("*")
      .then(rows => {
        return rows[0];
      });
  },
  // Find favorite park by id and then return it
  getById(knex, id) {
    return knex
      .from("favorite_parks")
      .select("*")
      .where("id", id)
      .first();
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
  }
};

module.exports = favorite_parksService;
