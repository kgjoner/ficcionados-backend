const queries = require('./queries')

const imgPath = 'https://res.cloudinary.com/hedf1kadi/image/upload/v1547811859/'

module.exports = app => {

    const { existOrError } = app.api.validator

    const makeTabs = (content, n) => {
        const tabs = content.split('[[tab')
        tabs.splice(0,1)
        let tabsHTML = ''
        let titles = []
        tabs.forEach(tab => {
            const open = tab.match("open") ? ` active` : ''
            const title = tab.match(/(title=")(((?!]]).)+)(")/i)[2]
            titles.push(title+'/%'+open)
            tab = tab.replace('[[/tab]]', '')
            tab = tab.replace(/title=".+"(.+)?]]/i, '')
            tabsHTML = tabsHTML + `<div id="${n}-${title}" class="tab${n} tabcontent${open}">` 
            + tab + '</div>'
        })
        
        let tabHeaderHTML = `<div class="tab">`
        titles.forEach(title => {
            const open = title.split('/%')[1] || ''
            title = title.split('/%')[0] 
            tabHeaderHTML = tabHeaderHTML + `<button class="tab${n} tablinks ${open}" onclick="openTab(event, '${n}-${title}')">${title}</button>`
        })
        tabHeaderHTML = tabHeaderHTML + "</div>"

        return tabHeaderHTML + tabsHTML
    }

    const makeAccordions = (content) => {
        const open = content.match("open") ? ` active` : ''
        const title = content.match(/(title=")(((?!]]).)+)(")/i)[2]
        const panel = content.split(']]')[1]
        return `<div><button class="accordion${open}" onclick="openAccordion(event)">${title}</button>
        <div class="accordion-panel">${panel}</div></div>`
    }

    const makeImgs = (content) => {
        const filename = content.match(/(src=")(((?!\s).)+)(")/i)[2]
        let align = content.match(/(align=")(((?!\s).)+)(")/i) || "center"
        if(align!=="center") align = align[2]
        let size = content.match(/(size=")(((?!\s).)+)(")/i) || "100%"
        if(size!=="100%") size = size[2]
    
        return `<img class="img-align-${align}" src="${imgPath}${filename}" style="max-width:${size};">`
    }

    const transpileContent = (content) => {

        function pipeTabs(content) {
            let tabs = content.split('[[tabs]]')
            if(tabs.length>1) {
                let n = 0
                tabs = tabs.map(tab => {
                    if (!tab.match('[[/tabs]]')) return tab
                    const rest = tab.split('[[/tabs]]')[1]
                    tab = tab.split('[[/tabs]]')[0]
                    n += 1
                    return makeTabs(tab, n) + rest
                })
                content = tabs.join('')
            }
            return content
        }

        function pipeAccordions (content) {
            let accordions = content.split('[[accordion')
            if(accordions.length>1) {
                accordions = accordions.map(accordion => {
                    if (!accordion.includes('[[/accordion]]')) return accordion
                    const rest = accordion.split('[[/accordion]]')[1]
                    accordion = accordion.split('[[/accordion]]')[0]
                    return makeAccordions(accordion) + rest
                })
                content = accordions.join('')
            }
            return content
        }

        function pipeImgs (content) {
            let imgs = content.split('[[img')
            if(imgs.length>1) {
                imgs = imgs.map(img => {
                    if (!img.match('src')) return img
                    const rest = img.split('/]]')[1]
                    img = img.split(`/]]`)[0]
                    return makeImgs(img) + rest
                })
                content = imgs.join('')
            }
            return content
        }

        content = content.split('[hr]').join('<hr>')
        return pipeTabs(pipeAccordions(pipeImgs(content)))
    }

    const save = async (req, res) => {
        const article = {... req.body}
        if (req.params.id) article.id = req.params.id
 
        try {
            existOrError(article.name, 'Título não informado')
            existOrError(article.slug, 'Slug não informado')
            existOrError(article.description, 'Descrição não informada')
            existOrError(article.content, 'Conteúdo não informado')
            existOrError(article.userId, 'Autor não informado')
            existOrError(article.categoryId, 'Categoria não informada')
        } catch(msg) {
            res.status(400).send(msg)
        }

        article.content = transpileContent(article.content)        

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
        const order = req.query.order || 'publishedAt'
        const scheduled = req.query.scheduled? true : false
        
        const result = await app.db('articles').count('id').first()
        const count = parseInt(result.count)

        app.db({a: 'articles', u: 'users'})
            .select('a.id', 'a.name', 'a.description', 'a.imageId', 'a.publishedAt', 'a.slug', {author: 'u.name'})
            .whereRaw('?? = ??', ['u.id', 'a.userId'])
            .modify(function(queryBuilder) {
                if (!scheduled) {
                    queryBuilder.where('publishedAt', '<', new Date())
                }
            })  
            .orderBy(order, 'desc')
            .limit(limit).offset(page*limit - limit) //offset é o deslocamento, a partir de qual linha a página começa
            .then(articles => res.json({ data: articles, count, limit }))
            .catch(err => res.status(500).send())
    }

    const getAll = (req, res) => {
        const order = req.query.order || 'publishedAt'
        const scheduled = req.query.scheduled || false

        app.db('articles')
            .modify(function(queryBuilder) {
                if (!scheduled) {
                    queryBuilder.where('publishedAt', '<', new Date())
                }
            })
            .orderBy(order, 'desc')
            .then(articles => {
                res.json(articles.map(article => {
                    if(!article.content) return article
                    return {
                        ...article,
                        content: article.content.toString()
                    }
                }))
            })
            .catch(err => res.status(500).send(err))
    }

    const getById = (req, res) => {
        app.db({a: 'articles'})
            .where( {id : req.params.id}).first()
            .then(article => {
                if(article.content) article.content = article.content.toString()
                return res.json(article)
            })
            .then(_ => res.status(204).send())
            .catch(err => res.status(500).send())
    }

    const getBySlug = (req, res) => {
        app.db({a: 'articles'})
            .select('a.id', 'a.name', 'a.description', 'a.imageId', 'a.publishedAt', 'a.editedAt', 'a.content', 
                'a.order', {author: 'u.name'}, 'u.email', 'u.bio', 'u.website', 'u.facebook', 'u.instagram', 
                'u.twitter', 'u.wattpad', 'u.sweek', {category: 'c.name'}, 'c.parentId')
            .join({u:'users'}, function() {
                this.on('a.userId', '=', 'u.id').onIn('a.slug', req.params.slug)
            }).first()
            .join({c:'categories'}, function() {
                this.on('a.categoryId', '=', 'c.id').onIn('a.slug', req.params.slug)
            }).first()
            .then(article => {
                if(article.content) article.content = article.content.toString()
                if(article.bio) article.bio = article.bio.toString()
                return res.json(article)
            })
            .then(_ => res.status(204).send())
            .catch(err => res.status(500).send())
    }

    const getByCategory = async (req, res) => {
        const categoryId = Number(req.params.id)
        if(!categoryId) return res.status(400).send('Category not informed')

        const page = req.query.page || 1
        const categories = await app.db.raw(queries.categoryWithChildren, categoryId)
        if(!categories) return
        const ids = categories.rows.map(c => c.id)

        const orderParam = req.query.order
        const direction = orderParam == 'order' ? 'asc' : 'desc'

        if(orderParam === 'random') {
            app.db('articles')
                .select('id', 'name', 'description', 'slug')
                .limit(4)
                .whereNot('id', page) //I'm using page here to actually mean the articleId
                .where('publishedAt', '<', new Date())
                .whereIn('categoryId', ids)
                .orderByRaw('RANDOM()')
                .then(articles => res.json(articles))
                .catch(err => res.status(500).send(err))
        } else {
            app.db({a: 'articles', u: 'users'})
                .select('a.id', 'a.name', 'a.description', 'a.imageId', 'a.publishedAt', 'a.order', 'a.slug', {author: 'u.name'})
                .limit(limit).offset(page*limit-limit)
                .whereRaw('?? = ??', ['u.id', 'a.userId'])
                .whereIn('categoryId', ids)
                .where('publishedAt', '<', new Date())
                .orderBy(orderParam, direction)
                .then(articles => res.json(articles))
                .catch(err => res.status(500).send(err))
        }       
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
            .select('a.id', 'a.name', 'a.description', 'a.imageId', 'a.publishedAt', 'a.order', 'a.slug', {author: 'u.name'})
            .limit(limit).offset(page*limit-limit)
            .whereRaw('?? = ??', ['u.id', 'a.userId'])
            .whereIn('a.id', ids)
            .where('publishedAt', '<', new Date())
            .then(articles => {
                res.json(articles)
            })
            .catch(err => res.status(500).send(err))
            
    }

    const getInRange = (req, res) => {
        const ids = JSON.parse(req.query.articles)

        app.db({a: 'articles', u: 'users', c: 'categories'})
        .select('a.id', 'a.name', 'a.description', 'a.imageId', 'a.publishedAt', 'a.slug',
            'a.categoryId', {author: 'u.name'}, {category: 'c.name'})
        .whereRaw('?? = ??', ['u.id', 'a.userId'])
        .whereRaw('?? = ??', ['c.id', 'a.categoryId'])
        .whereIn('a.id', ids)
        .then(articles => res.json(articles))
        .catch(err => res.status(500).send())
    }

    const getPreview = (req, res) => {
        app.db({a: 'articles'})
            .select('a.id', 'a.name', 'a.description', 'a.imageId', 'a.publishedAt', 'a.editedAt', 'a.content', 
                {author: 'u.name'}, 'u.email', 'u.bio', 'u.website', 'u.facebook', 'u.instagram', 
                'u.twitter', 'u.wattpad', 'u.sweek', {category: 'c.name'}, 'c.parentId')
            .join({u:'users'}, function() {
                this.on('a.userId', '=', 'u.id').onIn('a.id', req.query.id)
            }).first()
            .join({c:'categories'}, function() {
                this.on('a.categoryId', '=', 'c.id').onIn('a.id', req.query.id)
            }).first()
            .then(article => {
                if(article.content) article.content = article.content.toString()
                if(article.bio) article.bio = article.bio.toString()
                return res.json(article)
            })
            .then(_ => res.status(204).send())
            .catch(err => res.status(500).send())
    }

    return {save, remove, get, getAll, getById, getByCategory, getByTerm, getBySlug, getInRange, getPreview}

}