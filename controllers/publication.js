const Publication = require('../models/publication');
const fs = require('fs');
const path = require('path');
const followService = require('../services/followService');
const pruebaPublication = (req, res) => {

    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/publication.js"
    });
}

//Guardar publicacion
const save = async (req, res) => {
    try {
        const params = req.body;

        if (!params.text) {
            return res.status(400).send({
                status: "error",
                message: "debe de enviar el texto de la publicacion"
            });
        }

        let newPublicacion = new Publication(params);
        newPublicacion.user = req.user.id;
        // Guardar en base de datos
        const publicationStored = await newPublicacion.save();

        if (!publicationStored) {
            return res.status(400).send({
                status: "error",
                message: "No se ha guardado la publicacion"
            });
        }

        return res.status(200).send({
            status: "success",
            message: "Publicacion guardada",
            publicationStored
        })

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al guardar la publicacion"
        });
    }
}

const detail = async (req, res) => {
    try {
        const publicationId = req.params.id;
        const publicationStored = await Publication.findById(publicationId).exec();

        if (!publicationStored) {
            return res.status(404).send({
                status: "error",
                message: "La publicacion no existe"
            });
        }

        return res.status(200).send({
            status: "success",
            message: "Mostrar publicacion",
            publication: publicationStored
        });

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al devolver los datos de la publicacion"
        });

    }
}

const remove = async (req, res) => {
    try {
        const publicationId = req.params.id;
        const findPublication = await Publication.findOneAndDelete({ "user": req.user.id, "_id": publicationId });

        if (!findPublication) {
            return res.status(404).send({
                status: "error",
                message: "No se ha podido eliminar la publicacion"
            });
        }
        return res.status(200).send({
            status: "success",
            message: "Publicacion eliminada",
            publication: findPublication
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al eliminar la publicacion"
        });
    }
}

const user = async (req, res) => {
    try {
        const userId = req.params.id;
        let page = 1;

        if (req.params.page) page = req.params.page;

        let itemsPerPage = 5;
        const publications = await Publication.find({ "user": userId })
            .sort({  create_at: -1 })
            .populate("user", "-password -role -__v -email")
            .paginate(page, itemsPerPage)
            .exec();

        if (!publications || publications.length <= 0) {
            return res.status(404).send({
                status: "error",
                message: "No se han podido encontrar las publicaciones"
            });
        }

        const total = await Publication.countDocuments({ "user": userId });

        return res.status(200).send({
            status: "success",
            message: "Publicaciones encontradas",
            page,
            total,
            pages: Math.ceil(total / itemsPerPage),
            publications
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al devolver los datos de la publicacion"
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
        const publicationUpdated = await Publication.findByIdAndUpdate({ "user": req.user.id, "_id": req.params.id }, { file: req.file.filename }, { new: true }).exec();

        if (!publicationUpdated) {
            return res.status(404).send({
                status: "error",
                message: "Error en la subida de la imagen"
            });
        }
        //Devolver respuesta
        return res.status(200).send({
            status: "success",
            publication: publicationUpdated,
            file: req.file,
        })
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error en la subida de la imagen"
        })
    }
}

const media = (req, res) => {

    const file = req.params.file;
    const filePath = "./uploads/publications/" + file;

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

const feed = async (req, res) => {
    let page = req.params.page || 1;
    let itemsPerPage = 5;
    try {
        const myFollows = await followService.followUserIds(req.user.id);
        const publications = await Publication.find({ user: myFollows.following })
            .populate("user", "-password -role -__v -email")
            .paginate(page, itemsPerPage)
            .sort({ create_at: -1 })

        if (!publications || publications.length <= 0) {
            return res.status(404).send({
                status: "error",
                message: "No se han podido encontrar las publicaciones"
            });
        }

        const total = await Publication.countDocuments({ user: myFollows.following });

        return res.status(200).send({
            status: "success",
            message: "Publicaciones del feed",
            following: myFollows.following,
            total,
            page,
            pages: Math.ceil(total / itemsPerPage),
            publications
        });

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al devolver los datos de las publicaciones"
        });
    }
}

module.exports = {
    pruebaPublication,
    save,
    detail,
    remove,
    user,
    upload,
    media,
    feed
}