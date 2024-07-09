//Importar dependencias
const jwt = require('jwt-simple');
const moment = require('moment');

//Clave secreta
const secret = 'CLAVE_SECRETA_DEL_PROYECTO_DE_LA_RED_SOCIAL_231199';

//Crear una función para generar el token
const createToken = (user) => {
    const payload = {
        id: user._id,
        name: user.name,
        lastname: user.lastname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        image: user.image,
        iat: moment().unix(),
        exp: moment().add(30, 'days').unix()
    };
    //Devolver el token
    return jwt.encode(payload, secret);
}

module.exports = {
    createToken,
    secret
}