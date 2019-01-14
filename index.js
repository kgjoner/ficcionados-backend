const app = require('express')()
const consign = require('consign')
const db = require('./config/db.js')
const mongoose = require('mongoose')

const port = process.env.PORT || 3000

require('./config/mongodb')

app.db = db
app.mongoose = mongoose

consign()
    .include('./config/passport.js')
    .then('./config/middlewares.js')
    .then('./api/validator.js')
    .then('./api') //todos os aquivos dentro de api
    .then('./schedule')
    .then('./config/routes.js')
    .into(app)

app.listen(port, () => {
    console.log('Backend executando...'+port)
})
