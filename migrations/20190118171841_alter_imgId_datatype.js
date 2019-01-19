
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('articles', table => {
        table.string('imageId', 100).alter()
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.alterTable('articles', table => {
        table.integer('imageId').alter()
    })
};
