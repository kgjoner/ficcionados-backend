module.exports = app => {
    const StandOutArticles = app.mongoose.model('StandOutArticles', {
        recommended: Array,
        interviews: Array,
        createdAt: Date
    })

    const get = (req, res) => {
        StandOutArticles.findOne({}, {}, { sort: {'createdAt': -1} })
            .then(standOutArticles => {
                const defaultStandOutArticles = {
                    recommended: [1,1,1],
                    interviews: [1,1,1],
                    createdAt: 0,
                }
                res.json(standOutArticles || defaultStandOutArticles)
            })
    }

    const save = async (req, res) => {

        const keyToBeAltered = req.body.key
        const indexToBeAltered = Number(req.body.index)
        const newSelectedArticle = Number(req.body.article)

        const lastOne = await StandOutArticles.findOne({}, {}, { sort: {'createdAt': -1}})

        let newOne = lastOne || { recommended: [1,1,1], interviews: [1,1,1], createdAt: 0 }

        
        newOne[keyToBeAltered][indexToBeAltered] = newSelectedArticle;
        
        const standOutArticles = new StandOutArticles({
            recommended: newOne.recommended,
            interviews: newOne.interviews,
            createdAt: new Date()
        })

        standOutArticles.save().then(() => console.log('Artigos de destaque atualizados!'))
        res.send(204)
    }

    return { StandOutArticles, get, save }
}