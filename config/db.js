const config = require('../knexfile.js')
const knex = require('knex')(config)

knex.migrate.latest([config]) //carrega todas as migrations

module.exports = knex

