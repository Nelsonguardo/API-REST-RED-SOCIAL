//importar dependencias
const connection = require('./database/connection');
const express = require('express');
const cors = require('cors');

//Mensaje de bienvenida
console.log("API para RED SOCIAL arrancada"); 

//Conexion a la base de datos
connection();

//Crear servidor Node 
const app = express();
const puerto = 3900;

//Configurar Cors
app.use(cors());

//Convertir los datos del body a objetos JS
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//cargar conf de rutas
const userRouter = require('./routes/user');
const followRouter = require('./routes/follow');
const publicationRouter = require('./routes/publication');

app.use('/api/user', userRouter);
app.use('/api/follow', followRouter);
app.use('/api/publication', publicationRouter);

//ruta de prueba
app.get("/ruta-prueba", (req, res) =>{
    
    return res.status(200).json(
        {
            id: "1",
            "nombre": "Nelson",
            "edad": "24"
        }
    );

})

//Poner servidor a escuchar peticiones
app.listen(puerto, () => {
    console.log(`Servidor corriendo en el puerto ${puerto}`);
})