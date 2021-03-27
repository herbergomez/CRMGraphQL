const mongoose = require('mongoose');

require('dotenv').config({ path: 'variables.env' });

const conectarDB = async() => {
    try {
        await mongoose.connect(process.env.DB_MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: true,
            useCreateIndex: true
        });

        console.log('DB conetada');
    } catch (err) {
        console.log('Hubo un error', err);
        process.exit(1); //detener la app
    }
}


module.exports = conectarDB;