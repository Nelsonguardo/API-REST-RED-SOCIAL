const follow = require('../models/follow');
const Follow = require('../models/follow');
const User = require('../models/user');

//importar servicios
const followService = require('../services/followService');

//importar dependencias
const mongoosePaginate = require('mongoose-pagination');

const pruebaFollow = (req, res) => {

    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/follow.js"
    });
}

const save = async (req, res) => {
    try {
        const params = req.body;
        const identity = req.user;

        let userToFollow = new Follow({
            user: identity.id,
            followed: params.followed
        });

        followStored = await userToFollow.save();

        if (!followStored) {
            return res.status(500).json({
                status: 'error',
                message: 'Error al seguir'
            });
        }

        return res.status(200).json({
            status: 'success',
            follow: followStored
        });

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Eror al seguir"
        });
    }
}

const unfollow = async (req, res) => {
    try {
        const userId = req.user.id;
        const followedId = req.params.id;

        const result = await Follow.deleteOne({
            user: userId,
            followed: followedId
        });

        if (result.deletedCount === 0) {
            return res.status(404).send({
                status: "error",
                message: "No se encontró la relación de seguimiento para eliminar"
            });
        }

        return res.status(200).send({
            status: "success",
            message: "Follow eliminado correctamente"
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al dejar de seguir"
        });
    }
};

const following = async (req, res) => {
    try {
        // sacar el id del usuario logueado
        let userId = req.user.id;
        // comprobar si me llega el id por la url
        if (req.params.id) userId = req.params.id;
        // comprobar si me llega la página, si no la tengo por defecto a 1
        let page = 1;
        if (req.params.page) page = parseInt(req.params.page);
        // usuarios que quiero por página
        let itemsPerPage = 5;

        // Encontrar los follows del usuario
        const follows = await Follow.find({ user: userId })
            .populate("followed", "-password -role -__v -email")
            .paginate(page, itemsPerPage)
            .exec();

        // Contar el total de follows
        const total = await Follow.countDocuments({ user: userId });

        let followUserIds = await followService.followUserIds(userId)

        return res.status(200).send({
            status: "success",
            message: "Listado de usuarios que sigues",
            follows: follows,
            total: total,
            pages: Math.ceil(total / itemsPerPage),
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Error al obtener los usuarios que sigues",
            error: err.message,
        });
    }
};

const followed = async (req, res) => {
    try {
        // sacar el id del usuario logueado
        let userId = req.user.id;
        // comprobar si me llega el id por la url
        if (req.params.id) userId = req.params.id;
        // comprobar si me llega la página, si no la tengo por defecto a 1
        let page = 1;
        if (req.params.page) page = parseInt(req.params.page);
        // usuarios que quiero por página
        let itemsPerPage = 5;

        // Encontrar los follows del usuario
        const follows = await Follow.find({ followed: userId })
            .populate("user", "-password -role -__v -email")
            .paginate(page, itemsPerPage)
            .exec();

        // Contar el total de follows
        const total = await Follow.countDocuments({ user: userId });

        let followUserIds = await followService.followUserIds(userId)

        return res.status(200).send({
            status: "success",
            message: "Listado de usuarios que me siguen",
            follows: follows,
            total: total,
            pages: Math.ceil(total / itemsPerPage),
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Error al obtener los usuarios que sigues",
            error: err.message,
        });
    }
}

module.exports = {
    pruebaFollow,
    save,
    unfollow,
    following,
    followed
}