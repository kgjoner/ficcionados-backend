
exports.up = function (knex, Promise) {
    return knex.schema.alterTable('categories', table => {
        table.integer('order')
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.alterTable('categories', table => {
        table.dropColumn('order')
    })
};
