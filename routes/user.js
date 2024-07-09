const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const check = require('../middlewares/auth');
const multer = require('multer');

//Configuracion de subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/avatars');
    },
    filename: (req, file, cb) => {
        cb(null, 'avatar-' + new Date().getTime()+ '-' + file.originalname);
    }
});

const uploads = multer({storage});


//Definir rutas
router.get('/prueba-usuario', check.auth, userController.pruebaUser);
router.get('/profile/:id', check.auth, userController.profile);
router.get('/list/:page?', check.auth, userController.list);
router.get('/avatar/:file',userController.avatar);
router.get('/counters/:id?', check.auth, userController.counters);
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/upload', [check.auth, uploads.single('file0')] , userController.upload);
router.put('/update/', check.auth, userController.update);

//Exportar rutas
module.exports = router;