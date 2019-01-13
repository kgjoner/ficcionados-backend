const bcrypt = require('bcrypt-nodejs')

module.exports = app => {

    const { existOrError, notExistOrError, equalsOrError} = app.api.validator

    const encryptPassword = password => {
        const salt = bcrypt.genSaltSync(10)
        return bcrypt.hashSync(password, salt)
    }

    const save = async (req,res) => {
        const user = { ...req.body }
        if (req.params.id) user.id = req.params.id

        if(!req.originalUrl.startsWith('/users')) user.admin = false
        if(!req.user || !req.user.admin) user.admin = false

        try {
            existOrError(user.name, 'Nome não informado')
            existOrError(user.email, 'E-mail não informado')
            existOrError(user.password, 'Senha não informada')
            existOrError(user.confirmPassword, 'É preciso confirmar a senha')
            equalsOrError(user.password, user.confirmPassword, 'Senhas não conferem')

            const userFromDB = await app.db('users')
                .where({ email: user.email }).first()
                .whereNull('deletedAt')
            if(!user.id) notExistOrError(userFromDB, 'Usuário já cadastrado')
            
        } catch(msg) {
            return res.status(400).send(msg)
        }

        user.password = encryptPassword(user.password)
        delete user.confirmPassword

        const oldUser = await app.db('users')
            .where({ email: user.email }).first()

        if(user.id) {
            app.db('users')
                .update(user)
                .where({ id: user.id })
                .whereNull('deletedAt')
                .then(_ => res.status(204).send())
                .catch(err => res.status(500).send(err))
        } else if(oldUser) {
            user.id = oldUser.id
            user.deletedAt = null
            app.db('users')
                .update(user)
                .where({ email: user.email })
                .then(_ => res.status(204).send())
                .catch(err => res.status(500).send(err))
        } else {
            app.db('users')
                .insert(user)
                .then(_ => res.status(204).send())
                .catch(err => res.status(500).send(err))
        }
    }

    const get = (req, res) => {
        app.db('users')
            .select('id', 'name', 'email', 'admin')
            .whereNull('deletedAt')
            .then(users => res.json(users))
            .catch(err => res.status(500).send(err))
    }

    const getById = (req, res) => {
        app.db('users')
        .select('id', 'name', 'email', 'admin', 'bio', 'website', 'facebook', 'twitter', 'instagram', 'wattpad')
        .where( {id : req.params.id}).first()
        .whereNull('deletedAt')
        .then(user => {
            if(user.bio) user.bio = user.bio.toString()
            res.json(user)
        })
        .catch(err => res.status(500).send(err))
    }

    const remove = async (req, res) => {

        try {
            const articles = await app.db('articles')
                .where({ userId: req.params.id })           
            notExistOrError(articles, 'Usuário possui artigos.')

            const rowsDeleted = await app.db('users')
                .update({deletedAt: new Date()})
                .where({id: req.params.id})
            existOrError(rowsDeleted, 'Usuário não encontrado.')

            res.status(204).send()

        } catch(msg) {
            res.status(400).send(msg)
        }

    }


    return { save, get, getById, remove }
}