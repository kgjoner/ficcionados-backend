module.exports = app => {
    const StandOutArticles = app.mongoose.model('StandOutArticles', {
        recommended: Array,
        interviews: Array,
        createdAt: Date
    })

    const get = (req, res) => {
        StandOutArticles.findOne({})
            .then(currentData => {
                const defaultStandOutArticles = {
                    recommended: [1,1,1],
                    interviews: [1,1,1],
                    createdAt: 0,
                }
                res.json(currentData || defaultStandOutArticles)
            })
    }

    const save = async (req, res) => {

        const keyToBeAltered = req.body.key
        const indexToBeAltered = Number(req.body.index)
        const newSelectedArticle = Number(req.body.article)

        const lastOne = await StandOutArticles.findOne({})

        let newOne = lastOne || { recommended: [1,1,1], interviews: [1,1,1], createdAt: 0 }

        
        newOne[keyToBeAltered][indexToBeAltered] = newSelectedArticle;

        if (!lastOne) {
            const newOneDeclared = new StandOutArticles ({
                recommended: newOne.recommended,
                interviews: newOne.interviews,
                createdAt: new Date()
            })
            newOneDeclared.save()
                .then(data => console.log(data))
        } else {
            const changings = {
                recommended: newOne.recommended,
                interviews: newOne.interviews,
                createdAt: new Date()
            }
            StandOutArticles.updateOne({}, changings)
                .then(data => console.log(data))
        }
        res.sendStatus(204)
    }

    return { StandOutArticles, get, save }
}