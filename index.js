const express = require('express')
const app = express()
const consign = require('consign')
const db = require('./config/db.js')
const mongoose = require('mongoose')
const cloudinary = require('cloudinary')
const http = require('http')

const port = process.env.PORT || 3000

require('./config/mongodb')
require('./config/imgStore')

app.db = db
app.mongoose = mongoose
app.cloudinary = cloudinary

app.use(express.static('./uploads'));

consign()
    .include('./config/passport.js')
    .then('./config/middlewares.js')
    .then('./api/validator.js')
    .then('./api') //todos os aquivos dentro de api
    .then('./schedule')
    .then('./config/routes.js')
    .into(app)

setInterval(function() {
    console.log("Ping!")
    http.get("http://ficcionados-backend.herokuapp.com/categories");
}, 300000);

app.listen(port, () => {
    console.log('Backend executando...'+port)
})
