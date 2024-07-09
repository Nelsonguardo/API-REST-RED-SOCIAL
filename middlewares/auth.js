//Importar modulos
const jwt = require('jwt-simple');
const moment = require('moment');

//importar clave secreta
const libjwt = require('../services/jwt');
const secret = libjwt.secret;

//funcion de autenticacion
exports.auth = (req, res, next) => {
    //comprobar si me llega la cabezera de autenticacion
    if (!req.headers.authorization) {
        return res.status(403).send({
            status: 'error',
            message: 'La peticion no tiene la cabecera de autenticacion'
        });
    }
    //limpiar el token
    let token = req.headers.authorization.replace(/['"]+/g, '');
    //decodificar el token
    try {
        let payload = jwt.decode(token, secret);
        //comprobar si el token ha expirado
        if (payload.exp <= moment().unix()) {
            return res.status(401).send({
                status: 'error',
                message: 'El token ha expirado'
            });
        }
        //agregar datos al request
        req.user = payload;
    } catch (error) {
        return res.status(404).send({
            status: 'error',
            message: 'Token invalido',
            error
        });
    }

    //pasar a ejecucion de accion
    next();
}