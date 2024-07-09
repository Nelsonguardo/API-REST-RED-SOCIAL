const mongoose = require('mongoose');

const connection = async() =>{
    try {
        await mongoose.connect("mongodb://0.0.0.0:27017/mi_redsocial");

        console.log('Base de datos conectada: mi_redsocial');
        
    } catch (error) {
        console.log(error);
        throw new Error('No se ha podido conectar la base de datos');
    }

}

module.exports = connection
