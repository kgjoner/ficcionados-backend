const multer = require ('multer')
const Loki = require('lokijs')
const fs = require('fs')
const sharp = require('sharp')

const uploadPath = './uploads'
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadPath)
    },
    filename: function (req, file, cb) {
        const fileFormat = file.originalname.split('.')[1]
        const filename = req.body.title.toLowerCase().split(' ').join('-')
        cb(null, filename.normalize('NFD').replace(/[\u0300-\u036f]/g, "") + "." + fileFormat)
    }
  })
const upload = multer({ storage: storage }).single('image')

const dbName = 'serverdb.json'
const collectionName = 'images'
const dbInServer = new Loki(`${uploadPath}/${dbName}`, { persistenceMethod: 'fs' })


module.exports = app => {
    
    const loadCollection = (colName, db) => {
        return new Promise (resolve => {
            db.loadDatabase({}, () => {
                const collection = db.getCollection(colName) || db.addCollection(colName)
                resolve(collection)
            })
        })
    }

    const normalizeFileName = (title, filename) => {
        const fileFormat = filename.split('.')[1]
        const newName = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
        return newName.split(/[^\w]+/).join('-') + "." + fileFormat
    }

    const resizeImg = (filename) => {
        const newFilename = filename.split('.').join('-480w.')
        const originalImg = `./uploads/${filename}`
        const newImg = `./uploads/${newFilename}`

        sharp(originalImg)
            .resize({
                width: 480,
                fit: 'inside',
                withoutEnlargement: true
            })
            .toFile(newImg)
    }

    const post = (req,res) => {   
        upload(req, res, async () => {
            req.file.title = req.body.title
            req.file.alt = req.body.alt || req.body.title
            try {
                const col = await loadCollection(collectionName, dbInServer)
                const data = col.insert(req.file)
                dbInServer.saveDatabase()
                res.send({'id': data.$loki, 'fileName': data.filename, 'originalName': data.originalname})
                
                resizeImg(data.filename)
            } catch (e) {
                res.sendStatus(400)
            }
        })    
    }

    const update = async (req,res) => {
        try {
            const col = await loadCollection(collectionName, dbInServer)
            const data = col.get(req.params.id)
            const oldName = data.filename

            data.title = req.body.title
            data.alt = req.body.alt
            data.filename = normalizeFileName(req.body.title, data.filename)
            
            fs.rename(`./uploads/${oldName}`, `./uploads/${data.filename}`, function(err) {
                if(err)
                    res.status(500).send(err)
            })

            col.update(data)
            dbInServer.saveDatabase()

            res.sendStatus(204)           
        } catch (err) {
            res.sendStatus(400)
        }
    }

    const get = async (req,res) => {
        try {
            const col = await loadCollection(collectionName, dbInServer)
            res.send(col.data)
        } catch(e) {
            res.sendStatus(400)
        }
    }

    const getById = async (req, res) => {
        try {
            const col = await loadCollection(collectionName, dbInServer)
            const result = col.get(req.params.id)
            res.json(result)
            
        } catch (err) {
            res.sendStatus(400)
        }
    }

    const getInRange = async (req, res) => {
        try {
            const col = await loadCollection(collectionName, dbInServer)
            const results = col.find({ '$loki' : { '$in': req.query.ids } })
            res.json(results)
            
        } catch (err) {
            res.sendStatus(400)
        }
    }

    const remove = async (req, res) => {
        try {
            const col = await loadCollection(collectionName, dbInServer)
            const data = col.get(req.params.id)
            
            fs.unlink(`./uploads/${data.filename}`, function(err) {
                if(err)
                    res.status(500).send(err)
            })

            col.remove(data)
            dbInServer.saveDatabase()

            res.sendStatus(204)           
        } catch (err) {
            res.sendStatus(400)
        }
    }

    return { post, get, getById, update, remove, getInRange }
}