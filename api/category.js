module.exports = app => {

    const { existOrError, notExistOrError} = app.api.validator

    const save = (req,res) => {
        const category = {... req.body}
        if (req.params.id) category.id = req.params.id

        try {
            existOrError(category.name, 'Nome não informado')
            existOrError(category.order, 'Ordem não informada')
        } catch(msg) {
            return res.status(400).send(msg)
        }

        if(category.id) {
            app.db('categories')
                .update(category)
                .where({ id: category.id })
                .then( _ => res.status(204).send())
                .catch(err => res.status(500).send(err))
        } else {
            app.db('categories')
                .insert(category)
                .then( _ => res.status(204).send())
                .catch(err => res.status(500).send(err))
        }
    }

    const remove = async (req, res) => {
        try {
            existOrError(req.params.id, 'Código da categoria não informado')

            const subcategory = await app.db('categories').where({parentId: req.params.id})
            notExistOrError(subcategory, 'Categoria possui subcategorias.')

            const articles = await app.db('articles').where({ categoryId: req.params.id })
            notExistOrError(articles, 'Categoria possui artigos relacionados.')

            const rowsDeleted = await app.db('categories').where({id: req.params.id}).del()
            existOrError(rowsDeleted, 'Categoria não encontrada.')

            res.status(204).send()

        } catch(msg) {
            res.status(400).send(msg)
        }
    }

    const withPath = categories => {
        const getParent = (categories, parentId) => {
            const parent = categories.filter(c => c.id === parentId)
            return parent.length ? parent[0] : null
        }

        const categoriesWithPath = categories.map(category => {
            let path = category.name
            let parent = getParent(categories, category.parentId)

            while(parent) {
                path = `${parent.name} > ${path}`
                parent = getParent(categories, parent.parentId)
            }

            return { ...category, path }
        })

        categoriesWithPath.sort((a,b) => {
            if(a.path < b.path) return -1
            if(a.path > b.path) return 1
            return 0
        })

        return categoriesWithPath     
    }

    const get = (req, res) => {
        app.db('categories')
            .orderBy('order', 'asc')
            .then(categories => res.json(withPath(categories)))
            .catch(err => res.status(500).send(err))
    }

    const getById = (req, res) => {
        app.db('categories')
            .where({ id : req.params.id }).first()
            .then(category => res.json(category))
            .catch(err => res.status(500).send(err))
    }

    const toTree = (categories, tree) => {
        if(!tree) {
            tree = categories.filter(c => !c.parentId)
            tree = tree.sort((a,b) => a.order - b.order)
        }
        tree = tree.map(parentBranch => {
            const isChild = branch => branch.parentId == parentBranch.id
            const children = categories.filter(isChild).sort((a,b) => a.order - b.order)
            parentBranch.children = toTree(categories, children)
            return parentBranch
        })
        return tree
    }

    const getTree = (req, res) => {
        app.db('categories')
            .then(categories => res.json(toTree(categories)))
            .catch(err => res.status(500).send(err))
    }

    return { save, remove, get, getById, getTree }

}