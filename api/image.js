const multer = require ('multer')
// const fs = require('fs')
const sharp = require('sharp')

const uploadPath = './uploads'
const uploadUrl = 'https://res.cloudinary.com/hedf1kadi/image/upload/v1547811859/'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadPath)
    },
    filename: function (req, file, cb) {
        const fileFormat = file.originalname.split('.')[1]
        const filename = req.body.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
        cb(null, filename.split(/[^\w]+/).join('-') + "." + fileFormat)
    }
  })
const upload = multer({ storage: storage }).single('image')


module.exports = app => {

    const { existOrError } = app.api.validator
    
    const Image = app.mongoose.model('Image', {
        filename: String,
        title: String,
        alt: String,
        format: String,
        url: String
    })

    const normalizeFilename = (title, fileFormat) => {
        const newName = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
        return newName.split(/[^\w]+/).join('-') + "." + fileFormat
    }

    const resizeImg = (filename) => {
        const originalImg = `./uploads/${filename}`
        const newFilename480 = filename.split('.').join('-480w.')
        const newImg480 = `./uploads/${newFilename480}`
        const newFilename240 = filename.split('.').join('-240w.')
        const newImg240 = `./uploads/${newFilename240}`

        sharp(originalImg)
            .resize({
                width: 480,
                fit: 'inside',
                withoutEnlargement: true
            })
            .toFile(newImg480)
            .then( _ => {
                app.cloudinary.v2.uploader.upload(newImg480, { public_id: newFilename480.split('.')[0] })
                    .catch(e => res.status(500).send(e))
            })
       
        
        sharp(originalImg)
            .resize({
                width: 240,
                fit: 'inside',
                withoutEnlargement: true
            })
            .toFile(newImg240)
            .then( _ => {
                app.cloudinary.v2.uploader.upload(newImg240, { public_id: newFilename240.split('.')[0] })
                    .catch(e => res.status(500).send(e))
            })
    }

    const post = (req,res) => {   
        upload(req, res, async () => {
            try {
                existOrError(req.body.title, "Nome não informado")
                existOrError(req.file, "Arquivo não selecionado!")
            } catch(msg) {
                res.status(400).send(msg)
            }

            const fileFormat = req.file.filename.split('.')[1]
            const newFilename = normalizeFilename(req.body.title, fileFormat)
            
            const newImg = new Image({
                filename: newFilename,
                title: req.body.title,
                alt: req.body.alt || req.body.title,
                format: fileFormat,
                url: uploadUrl + newFilename
            })
            newImg.save()
                .catch(e => res.status(500).send(e))

            app.cloudinary.v2.uploader.upload(uploadPath + '/' + newFilename, { public_id: newFilename.split('.')[0] })
                .then(_ => res.status(204).send(newImg))
                .catch(e => res.status(500).send(e))

            resizeImg(newFilename)
        })    
    }

    const update = async (req,res) => {
        try {
            existOrError(req.body.title, "Nome não informado")
        } catch(msg) {
            res.status(400).send(msg)
        }

        Image.findById(req.params.id)
            .then(data => {
                const oldName = data.filename
                data.title = req.body.title
                data.alt = req.body.alt || req.body.title
                data.filename = normalizeFilename(req.body.title, data.format)
                data.url = uploadUrl + data.filename

                Image.update({ _id: req.params.id }, data)
                    .catch(e => res.status(500).send(e))
                
                app.cloudinary.v2.uploader.rename(oldName.split('.')[0], data.filename.split('.')[0])
                    .catch(e => res.status(500).send(e))
                app.cloudinary.v2.uploader.rename(oldName.replace(`.${data.format}`,'-480w'), data.filename.replace(`.${data.format}`,'-480w'))
                    .catch(e => res.status(500).send(e))
                app.cloudinary.v2.uploader.rename(oldName.replace(`.${data.format}`,'-240w'), data.filename.replace(`.${data.format}`,'-240w.'))
                    .catch(e => res.status(500).send(e))
            })
            .catch(e => res.send(e))

        res.sendStatus(204)
    }

    const get = async (req,res) => {
        Image.find({})
            .then(imgs => res.json(imgs))
            .catch(e => res.status(400).send(e))
    }

    const getById = async (req, res) => {
        Image.findById(req.params.id)
            .then(imgs => res.json(imgs))
            .catch(e => res.status(400).send(e))
    }

    const getInRange = async (req, res) => {
        Image.find({ 
            _id: { $in: req.query.ids.split(',') }
        })
            .then(imgs => res.send(imgs))
            .catch(e => res.status(500).send())
    }

    const remove = async (req, res) => {
        Image.findById(req.params.id)
            .then(data => {
                app.cloudinary.v2.uploader.destroy(data.filename.split('.')[0])
                    .catch(e => res.status(500).send(e))
                app.cloudinary.v2.uploader.destroy(data.filename.replace(`.${data.format}`,'-480w'))
                    .catch(e => res.status(500).send(e))
                app.cloudinary.v2.uploader.destroy(data.filename.replace(`.${data.format}`,'-240w'))
                    .catch(e => res.status(500).send(e))

                Image.deleteOne({_id: req.params.id})
                    .catch(e => res.status(500).send(e))
            })
            .then(_ => res.status(204).send())
            .catch(e => res.status(400).send(e))
        
    }

    return { post, get, getById, update, remove, getInRange }
}