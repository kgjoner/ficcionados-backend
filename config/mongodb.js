const mongoose = require('mongoose')
if (!process.env.MONGO_URI) {
    const { mongoURI } = require('../.env')
} else {
    mongoURI = process.env.MONGO_URI
}
mongoose.connect(mongoURI, {useNewUrlParser: true})
    .catch(e => {
        const msg = 'Não foi possível conectar com o MongoDB'
        console.log('\x1b[41m%s\x1b[37m', msg, '\x1b[0m')
    })
