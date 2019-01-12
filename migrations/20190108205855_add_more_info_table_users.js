
exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', table => {
        table.binary('bio')
        table.string('facebook')
        table.string('twitter')
        table.string('instagram')
        table.string('wattpad')
        table.string('website')
    })
  };
  
  exports.down = function(knex, Promise) {
      return knex.schema.alterTable('users', table => {
          table.dropColumn('bio')
          table.dropColumn('facebook')
          table.dropColumn('twitter')
          table.dropColumn('instagram')
          table.dropColumn('wattpad')
          table.dropColumn('website')
      })
  };
