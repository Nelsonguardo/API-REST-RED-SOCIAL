//importar modelos
const User = require('../models/user');
const Publication = require('../models/publication');
const Follow = require('../models/follow');
//importar dependencias y modulos
const bcrypt = require('bcrypt');
const fs = require('fs');
const mogoosePagination = require('mongoose-pagination');
const path = require('path');
//importar servicios
const jwt = require('../services/jwt');
const followService = require('../services/followService');
const validate = require('../helpers/validate');

const pruebaUser = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/user.js",
        user: req.user
    });
}

//registro de usuario
const register = async (req, res) => {
    try {
        // Recoger datos de la petición
        let params = req.body;

        if (params.email) {
            params.email = params.email.toLowerCase();
        }

        // Comprobar que llegan bien (+ validacion)
        if (!params.name || !params.email || !params.password || !params.nick) {
            return res.status(400).json({
                status: "error",
                message: "Faltan datos por enviar"
            });
        }

        try {
            validate(params);
        } catch (error) {
            return res.status(400).json({
                status: "error",
                message: "Validacion no superida" 
            });
        }

        // Control de usuarios duplicados
        const users = await User.find({
            $or: [
                { email: params.email.toLowerCase() },
                { nick: params.nick.toLowerCase() }
            ]
        }).exec();
        if (users && users.length >= 1) {
            return res.status(409).json({
                status: "error",
                message: "El usuario ya existe"
            });
        } else {
            // Cifrar contraseña
            let pwd = await bcrypt.hash(params.password, 10);
            params.password = pwd;
            // Crear objeto de usuario
            let user_to_save = new User(params);
            // Guardar en base de datos
            const userStored = await user_to_save.save();
            if (!userStored) {
                return res.status(500).json({
                    status: "error",
                    message: "Error al registrar usuario"
                });
            }
            // Devolver respuesta
            return res.status(200).json({
                status: "success",
                message: "Acción de registro de usuarios",
                user: userStored
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Error al buscar usuarios"
        });
    }
}

const login = async (req, res) => {
    try {
        // Recoger datos de la petición
        let params = req.body;
        if (!params.email || !params.password) {
            return res.status(400).send({
                status: "error",
                message: "Faltan datos por enviar"
            });
        }
        // Buscar en la base de datos si coincide con el email y la password
        const user = await User.findOne({ email: params.email })
            //.select({ password: 0 })
            .exec();
        if (!user) {
            return res.status(404).send({
                status: "error",
                message: "Usuario no existe"
            });
        }
        // comprobar la password
        const pwd = bcrypt.compareSync(params.password, user.password);
        if (!pwd) {
            return res.status(400).send({
                status: "error",
                message: "La password es incorrecta"
            })
        }
        //Devolver token
        const token = jwt.createToken(user);
        //Devolver datos del usuario
        return res.status(200).send({
            status: "success",
            message: "Te has logueado correctamente",
            user: {
                id: user._id,
                name: user.name,
                nick: user.nick,
            },
            token
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error interno del servidor"
        });
    }
};

const profile = async (req, res) => {
    try {
        const id = req.params.id;
        const userProfile = await User.findById(id).select({ password: 0, role: 0 }).exec();;
        if (!userProfile) {
            return res.status(404).send({
                status: "error",
                message: "El usuario no existe"
            });
        }
        let followInfo = await followService.followThisUser(req.user.id, id);

        return res.status(200).send({
            status: "success",
            user: userProfile,
            following: followInfo.following,
            follower: followInfo.follower
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al devolver los datos del usuario"
        });
    }
}

const list = async (req, res) => {
    try {
        let page = req.params.page || 1;
        page = parseInt(page);
        let itemsPerPage = 5;

        const result = await User.find()
            .select('-password -role -__v -email')
            .sort('_id')
            .paginate(page, itemsPerPage)
            .exec();

        if (!result || result.length === 0) {
            return res.status(404).send({
                status: "error",
                message: "No hay usuarios para mostrar"
            });
        }

        const total = await User.countDocuments();
        let followUserIds = await followService.followUserIds(req.user.id);

        // Devolver resultado
        return res.status(200).send({
            status: "success",
            users: result,
            page,
            itemsPerPage,
            total,
            pages: Math.ceil(total / itemsPerPage),
            user_follow: followUserIds.following,
            user_follow_me: followUserIds.followers
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al devolver los datos de los usuarios",
            error: error.message
        });
    }
}

const update = async (req, res) => {
    try {
        let userIdentity = req.user;
        let userToUpdate = req.body;

        delete userToUpdate.iat;
        delete userToUpdate.exp;
        delete userToUpdate.role;
        delete userToUpdate.image;

        const users = await User.find({
            $or: [
                { email: userToUpdate.email.toLowerCase() },
                { nick: userToUpdate.nick.toLowerCase() }
            ]
        }).exec();

        let userExists = false;
        users.forEach(user => {
            if (user && user._id != userIdentity.id) userExists = true;
        });

        if (userExists) {
            return res.status(409).json({
                status: "error",
                message: "El usuario ya existe"
            });
        }

        if (userToUpdate.password) {
            // Cifrar contraseña
            let pwd = await bcrypt.hash(userToUpdate.password, 10);
            userToUpdate.password = pwd;
        } else {
            delete userToUpdate.password;
        }

        const userUpdated = await User.findByIdAndUpdate({ _id: userIdentity.id }, userToUpdate, { new: true }).exec();

        if (!userUpdated) {
            return res.status(404).send({
                status: "error",
                message: "No se ha podido actualizar el usuario"
            });
        }

        return res.status(200).send({
            status: "success",
            message: "Usuario actualizado correctamente",
            user: userUpdated
        });
    } catch (error) {
        // Manejo de errores
        return res.status(500).send({
            status: "error",
            message: "Se ha producido un error al actualizar el usuario"
        });
    }
}

const upload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(404).send({
                status: "error",
                message: "Peticion no incluye la imagen"
            });
        }

        let image = req.file.originalname;
        const imgeSplit = image.split("\.");
        const extension = imgeSplit[1];

        if (extension != "png" && extension != "jpg" && extension != "jpeg" && extension != "gif") {
            const filePath = req.file.path;
            const fileDelete = fs.unlinkSync(filePath);
            return res.status(400).send({
                status: "error",
                message: "La extension de la imagen no es valida"
            })
        }
        //Guardar en la base de datos
        const userUpdated = await User.findByIdAndUpdate({ _id: req.user.id }, { image: req.file.filename }, { new: true }).exec();

        if (!userUpdated) {
            return res.status(404).send({
                status: "error",
                message: "Error en la subida del avatar"
            });
        }
        //Devolver respuesta
        return res.status(200).send({
            status: "success",
            user: userUpdated,
            file: req.file,
        })
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error en la subida del avatar"
        })
    }

}

const avatar = (req, res) => {

    const file = req.params.file;
    const filePath = "./uploads/avatars/" + file;

    fs.stat(filePath, (error, exists) => {
        if (!exists) {
            return res.status(400).send({
                status: "error",
                message: "No existe la imagen"
            });
        }
        return res.sendFile(path.resolve(filePath));
    })
}

const counters = async (req, res) => {
    let userId = req.user.id;

    if (req.params.id) {
        userId = req.params.id;
    }

    try {
        const following = await Follow.countDocuments({ user: userId });
        const followed = await Follow.countDocuments({ followed: userId });
        const publications = await Publication.countDocuments({ user: userId });

        return res.status(200).send({
            status: "success",
            following,
            followed,
            publications,
        });

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al devolver los datos de los usuarios",
            error: error.message
        })
    }
}


module.exports = {
    pruebaUser,
    register,
    login,
    profile,
    list,
    update,
    upload,
    avatar,
    counters
}