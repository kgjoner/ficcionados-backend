
exports.up = function (knex, Promise) {
    return knex.schema.alterTable('articles', table => {
        table.string('slug').unique()
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.alterTable('articles', table => {
        table.dropColumn('slug')
    })
};
