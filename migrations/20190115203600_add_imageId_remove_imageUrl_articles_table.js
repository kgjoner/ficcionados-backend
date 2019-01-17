
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('articles', table => {
        table.integer('imageId')
        table.dropColumn('imageUrl')
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.alterTable('articles', table => {
        table.dropColumn('imageId')
        table.string('imageUrl', 1000)
    })
};
