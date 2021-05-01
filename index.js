const express = require('express');
const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient
const bodyParser = require('body-parser')
const multer = require('multer')
const path = require('path')
const cors = require('cors')
const helpers = require('./helpers')



const app = express();
const port = 8080;

// Storage for images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    // By default, multer removes file extensions so let's add them back
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// MongoDB connection and ExpressJS definitions 
MongoClient.connect('mongodb://localhost:27017/smartscreen', { useUnifiedTopology: true })
    .then(client => {
        app.use(bodyParser.urlencoded({ extended: true }))
        app.use(bodyParser.json())
        app.use(express.static('public'))
        app.use(cors())
        app.set('view engine', 'ejs')

        const db = client.db('smartscreen')
        const screensCollection = db.collection('screens')
        const imagesCollection = db.collection('images')

        app.get('/', function (req, res) {
            screensCollection.find().toArray()
                .then(screens => {
                    imagesCollection.find().toArray()
                        .then(images => {
                            res.render('index.ejs',
                                {
                                    screens: screens,
                                    images: images
                                }
                            )
                        })
                })
                .catch(error => console.error(error))
        });

        app.get('/get_image', function (req, res) {
            screensCollection.findOne({ device_id: req.query.device_id })
                .then(screen => {
                    imagesCollection.findOne({ screen_id: screen._id.toString() })
                        .then(image => {
                            res.json(
                                {
                                    image_path: image.image_path
                                }
                            )
                        })
                })
                .catch(error => {
                    console.error(error)
                    res.send({})
                })
        });

        app.post('/screens', (req, res) => {
            console.log(req.body)
            screensCollection.insertOne(req.body)
                .then(result => {
                    console.log(result)
                    res.redirect('/')
                })
                .catch(error => console.error(error))
        })
        app.delete('/screens', (req, res) => {
            screensCollection.deleteOne(
                { _id: new mongodb.ObjectId(req.body.screen_id) }
            )
                .then(result => {
                    res.json(`Deleted screen`)
                })
                .catch(error => console.error(error))
        })

        app.post('/images', (req, res) => {
            console.log(req.body)

            let upload = multer({ storage: storage, fileFilter: helpers.imageFilter }).single('picture');
            upload(req, res, function (err) {
                if (req.fileValidationError) {
                    return res.send(req.fileValidationError);
                }
                else if (!req.file) {
                    return res.send('Please select an image to upload');
                }
                else if (err instanceof multer.MulterError) {
                    return res.send(err);
                }
                else if (err) {
                    return res.send(err);
                }
                imagesCollection.insertOne({
                    screen_id: req.body.screen_id,
                    image_path: path.normalize(req.file.path).replace(/\\/g, '/').split('/').slice(1).join('/')
                })
                    .then(result => {
                        console.log(result)
                        res.redirect('/')
                    })
                    .catch(error => console.error(error))
            });
        })
        app.delete('/images', (req, res) => {
            imagesCollection.deleteOne(
                { _id: new mongodb.ObjectId(req.body.image_id) }
            )
                .then(result => {
                    res.json(`Deleted image`)
                })
                .catch(error => console.error(error))
        })

        app.listen(port, '0.0.0.0');
        console.log('Server started at http://localhost:' + port);

    })
    .catch(error => console.error(error))