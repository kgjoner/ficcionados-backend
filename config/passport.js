const passport = require('passport')
const passportJwt = require('passport-jwt')
const { Strategy, ExtractJwt } = passportJwt
if(!process.env.AUTH_SECRET) {
    var { authSecret } = require('../.env')
} else {
    var authSecret = process.env.AUTH_SECRET
}

module.exports = app => {
    const params = {
        secretOrKey: process.env.AUTH_SECRET || authSecret,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    }

    const strategy = new Strategy(params, (payload, done) => {
        app.db('users')
            .where({ id: payload.id })
            .first()
            .then(user => done(null, user ? { ...payload } : false))
            .catch(err => done(err, false))
    })

    passport.use(strategy)

    return {
        authenticate: () => passport.authenticate('jwt', { session: false })
    }

}