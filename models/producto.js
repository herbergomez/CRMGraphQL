const mongoose = require('mongoose');

const ProductosSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },
    existencia: {
        type: Number,
        required: true,
        trim: true
    },
    precio: {
        type: Number,
        required: true,
        trim: true
    },
    creado: {
        type: Date,
        default: Date.now()
    }
});
//agregamos indice
ProductosSchema.index({ nombre: 'text' });
module.exports = mongoose.model('Producto', ProductosSchema);