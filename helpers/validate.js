const validator = require('validator');

const validate = (params) => {
    let name = !validator.isEmpty(params.name)
        && validator.isLength(params.name, { min: 3, max: undefined })
        && validator.isAlpha(params.name, 'es-ES');
    let lastname = !validator.isEmpty(params.lastname)
        && validator.isLength(params.lastname, { min: 3, max: undefined })
        && validator.isAlpha(params.lastname, 'es-ES');
    let nick = !validator.isEmpty(params.nick)
        && validator.isLength(params.nick, { min: 3, max: undefined });
    let email = !validator.isEmpty(params.email)
        && validator.isEmail(params.email);
    let password = !validator.isEmpty(params.password)
    let bio = validator.isLength(params.bio, { min: undefined, max: 255 });

    if (!name || !lastname || !nick || !email || !password || !bio) {
        console.log('No se ha recibido todos los datos');
        throw new Error('No se ha recibido todos los datos');
    } else {
        console.log('Se han recibido todos los datos');
    }
}

module.exports = validate
