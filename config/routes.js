const admin = require('./admin')


module.exports = app => {

    app.post('/signup', app.api.user.save)
    app.post('/signin', app.api.auth.signin)
    app.post('/validateToken', app.api.auth.validateToken)

    app.route('/favarticles')
        .get(app.api.article.getInRange)

    app.route('/users')
        .all(app.config.passport.authenticate())
        .get(admin(app.api.user.get))
        .post(admin(app.api.user.save))
    
    app.route('/users/:id')
        .get(app.api.user.getById)
        .all(app.config.passport.authenticate())
        .put(admin(app.api.user.save))
        .delete(admin(app.api.user.remove))

    app.route('/categories')
        .all(app.config.passport.authenticate())
        .get(admin(app.api.category.get))
        .post(admin(app.api.category.save))

    app.route('/categories/tree') //tem que vir antes de categories/:id !!!
        .get(app.api.category.getTree)

    app.route('/categories/:id')
        .get(app.api.category.getById)
        .all(app.config.passport.authenticate())
        .put(admin(app.api.category.save))
        .delete(admin(app.api.category.remove))

    app.route('/categories/:id/articles')
        .get(app.api.article.getByCategory)

    app.route('/articles')
        .get(app.api.article.get)
        .all(app.config.passport.authenticate())
        .post(admin(app.api.article.save))

    app.route('/articles/:id')
        .get(app.api.article.getById)
        .all(app.config.passport.authenticate())
        .put(admin(app.api.article.save))
        .delete(admin(app.api.article.remove))

    app.route('/stats')
        .all(app.config.passport.authenticate())
        .get(app.api.stat.get)

    app.route('/mailer')
        .post(app.api.mailer.post)

    app.route('/standoutarticles')
        .get(app.api.standOutArticles.get)
        .all(app.config.passport.authenticate())
        .put(admin(app.api.standOutArticles.save))
    
    app.route('/search')
        .get(app.api.article.getByTerm)

    app.route('/images')
        .get(app.api.image.get)
        .post(app.api.image.post)

    app.route('/images/:id')
        .get(app.api.image.getById)
        .put(app.api.image.update)
        .delete(app.api.image.remove)

    app.route('/cardimages')
        .get(app.api.image.getInRange)

    app.route('/:slug')
        .get(app.api.article.getBySlug)
}