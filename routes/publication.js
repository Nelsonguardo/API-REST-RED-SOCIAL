const express = require('express');
const router = express.Router();
const publicationController = require('../controllers/publication');
const check = require('../middlewares/auth');
const multer = require('multer');

//Configuracion de subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/publications');
    },
    filename: (req, file, cb) => {
        cb(null, 'pub-' + new Date().getTime()+ '-' + file.originalname);
    }
});

const uploads = multer({storage});


//Definir rutas
router.get('/prueba-publication', publicationController.pruebaPublication);
router.get('/detail/:id', check.auth, publicationController.detail);
router.get('/user/:id/:page?', check.auth, publicationController.user);
router.get('/media/:file', publicationController.media);
router.get('/feed/:page?', check.auth, publicationController.feed);
router.post('/save', check.auth, publicationController.save);
router.post('/upload/:id', [check.auth, uploads.single('file0')] , publicationController.upload);
router.delete('/remove/:id', check.auth, publicationController.remove);

//Exportar rutas
module.exports = router;