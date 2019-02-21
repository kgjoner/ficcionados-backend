
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', table => {
        table.string('sweek')
    })
  };
  
  exports.down = function(knex, Promise) {
      return knex.schema.alterTable('users', table => {
          table.dropColumn('sweek')
      })
  };
