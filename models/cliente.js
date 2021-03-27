const mongoose = require('mongoose');

const ClientesSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },
    apellido: {
        type: String,
        required: [true, 'El apellido es obligatorio'],
        trim: true
    },
    empresa: {
        type: String,
        required: [true, 'La empresa es obligatoria'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'La email es obligatorio'],
        trim: true,
        unique: true
    },
    telefono: {
        type: String,
        trim: true
    },
    creado: {
        type: Date,
        default: Date.now()
    },
    vendedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El vendedor es obligatorio']
    }
});

module.exports = mongoose.model('Cliente', ClientesSchema);