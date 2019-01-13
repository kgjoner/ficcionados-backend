const queries = require('./queries')

module.exports = app => {

    const { existOrError } = app.api.validator

    const makeTabs = (content) => {
        const tabs = content.split('[[tab')
        tabs.splice(0,1)
        let tabsHTML = ''
        let titles = []
        tabs.forEach(tab => {
            const open = tab.match("open") ? ` active` : ''
            const title = tab.match(/(title=")(.+)(?=")/i)[2]
            titles.push(title+'/%'+open)
            tab = tab.replace('[[/tab]]', '')
            tab = tab.replace(/title=".+"(.+)?]]/i, '')
            tabsHTML = tabsHTML + `<div id="${title}" class="tabcontent${open}">` 
            + tab + '</div>'
        })
        
        let tabHeaderHTML = `<div class="tab">`
        titles.forEach(title => {
            const open = title.split('/%')[1] || ''
            title = title.split('/%')[0] 
            tabHeaderHTML = tabHeaderHTML + `<button class="tablinks ${open}" onclick="openTab(event, '${title}')">${title}</button>`
        })
        tabHeaderHTML = tabHeaderHTML + "</div>"

        return tabHeaderHTML + tabsHTML
    }

    const save = (req, res) => {
        const article = {... req.body}
        if (req.params.id) article.id = req.params.id
        if (article.author) delete article.author

        try {
            existOrError(article.name, 'Título não informado')
            existOrError(article.description, 'Descrição não informada')
            existOrError(article.content, 'Conteúdo não informado')
            existOrError(article.userId, 'Autor não informado')
            existOrError(article.categoryId, 'Categoria não informada')
        } catch(msg) {
            res.status(400).send(msg)
        }

        let tabs = article.content.split('[[tabs]]')
        if(tabs.length>1) {
            tabs = tabs.map(tab => {
                if (!tab.match('[[/tabs]]')) return tab
                const rest = tab.split('[[/tabs]]')[1]
                tab = tab.split('[[/tabs]]')[0]
                return makeTabs(tab) + rest
            })
            article.content = tabs.join('')
        }


        if(article.id) {
            app.db('articles')
                .update(article)
                .where({ id: article.id })
                .then(_ => res.status(204).send())
                .catch(err => res.status(500).send(err))
        } else {
            app.db('articles')
                .insert(article)
                .then(_ => res.status(204).send())
                .catch(err => res.status(500).send(err))
        }

    }

    const remove = async (req, res) => {
        try {
            const rowsDeleted = await app.db('articles').where({id: req.params.id}).del()
            try { 
                existOrError(rowsDeleted, 'Artigo não encontrado.')
            } catch {
                res.status(400).send(msg)
            }

            res.status(204).send()

        } catch (msg) {
            res.status(500).send(msg)
        }

    }

    const limit = 10 //usado para paginação

    const get = async (req, res) => {
        const page = req.query.page || 1
        const order = req.query.order
        
        const result = await app.db('articles').count('id').first()
        const count = parseInt(result.count)

        app.db({a: 'articles', u: 'users'})
            .select('a.id', 'a.name', 'a.description', 'a.imageUrl', 'a.publishedAt', {author: 'u.name'})
            .whereRaw('?? = ??', ['u.id', 'a.userId'])
            .orderBy(order, 'desc')
            .limit(limit).offset(page*limit - limit) //offset é o deslocamento, a partir de qual linha a página começa
            .then(articles => res.json({ data: articles, count, limit }))
            .catch(err => res.status(500).send())
    }

    const getById = (req, res) => {
        app.db({a: 'articles'})
            .select('a.id', 'a.name', 'a.description', 'a.userId', 'a.categoryId', 'a.imageUrl',
                'a.publishedAt', 'a.editedAt', 'a.order', 'a.content', {author: 'u.name'})
            .join({u:'users'}, function() {
                this.on('a.userId', '=', 'u.id').onIn('a.id', req.params.id)
            }).first()
            .then(article => {
                article.content = article.content.toString()
                return res.json(article)
            })
            .then(_ => res.status(204).send())
            .catch(err => res.status(500).send())
    }

    const getByCategory = async (req, res) => {
        const categoryId = req.params.id
        const page = req.query.page || 1
        const categories = await app.db.raw(queries.categoryWithChildren, categoryId)
        const ids = categories.rows.map(c => c.id)

        const orderParam = req.query.order
        const order = orderParam == 'order' ? 'asc' : 'desc'

        app.db({a: 'articles', u: 'users'})
            .select('a.id', 'a.name', 'a.description', 'a.imageUrl', 'a.publishedAt', {author: 'u.name'})
            .limit(limit).offset(page*limit-limit)
            .whereRaw('?? = ??', ['u.id', 'a.userId'])
            .whereIn('categoryId', ids)
            .orderBy(orderParam, order)
            .then(articles => res.json(articles))
            .catch(err => res.status(500).send())       
    }

    const getByTerm = async (req, res) => {
        const term = req.query.s.toLowerCase().split('+').join('%')
        const charTerm = '%'+term+'%'
        let binTerm = term.split('%').map(word => {
            return word.split('').map(char => char.charCodeAt(0).toString(16)).join('')
        }).join('%')
        binTerm = '%'+binTerm+'%'
        const articleMatch = await app.db.raw(queries.termInContent, [binTerm, charTerm])
        const ids = articleMatch.rows.map(a => a.id)

        const page = req.query.page || 1
        
        app.db({a: 'articles', u: 'users'})
            .select('a.id', 'a.name', 'a.description', 'a.imageUrl', 'a.publishedAt', {author: 'u.name'})
            .limit(limit).offset(page*limit-limit)
            .whereRaw('?? = ??', ['u.id', 'a.userId'])
            .whereIn('a.id', ids)
            .then(articles => {
                res.json(articles)
            })
            .catch(err => res.status(500).send())
            
    }

    return {save, remove, get, getById, getByCategory, getByTerm}

}