
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('articles', table => {
    table.timestamp('publishedAt')
    table.timestamp('editedAt')
    table.integer('order')
  })
};

exports.down = function(knex, Promise) {
    table.dropColumn('publishedAt')
    table.dropColumn('editedAt')
    table.dropColumn('order')
};
