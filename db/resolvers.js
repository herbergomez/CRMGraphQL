const Usuario = require('../models/usuario');
const Producto = require('../models/producto');
const Cliente = require('../models/cliente');
const Pedido = require('../models/pedido');
const bcrypjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const crearToken = (usuario, secreta, expiresIn) => {
    const { id, email, nombre, apellido } = usuario;
    return jwt.sign({ id, email, nombre, apellido }, secreta, { expiresIn });
}

//Resolvers
const resolvers = {
    Query: {
        obtenerUsuario: async(_, {}, ctx) => {
            return ctx.usuario;
        },
        obtenerProductos: async() => {
            try {
                const resultado = await Producto.find({});
                return resultado;
            } catch (err) {
                console.log(err);
                throw new Error('Error al obtener la lista de productos');
            }
        },
        obtenerProductoPorId: async(_, { id }) => {
            try {
                //console.log("ID", id);
                const producto = await Producto.findById(id);
                if (!producto) {
                    throw new Error('Error producto no existe');
                }
                return producto;
            } catch (err) {
                console.log(err);
                throw new Error('Error al obtener el producto');
            }
        },
        obtenerClientes: async() => {
            try {
                const clientes = await Cliente.find({});
                return clientes;
            } catch (err) {
                console.log(err);
                throw new Error('Error al obtener los clientes');
            }
        },
        obtenerClientesVendedor: async(_, {}, ctx) => {
            try {
                console.log("USUARIO LOGUEADO: " + ctx.usuario.email);
               // if(!ctx.usuario) {
                    const clientes = await Cliente.find({ vendedor: ctx.usuario.id });
                    return clientes;
               // } return [];
                    
            
            } catch (err) {
                console.log(err);
                throw new Error('Error al obtener los clientes');
            }
        },
        obtenerClientePorId: async(_, { id }, ctx) => {
            try {
                const cliente = await Cliente.findById(id);
                if (!cliente) {
                    throw new Error('Error cliente no existe');
                }
                //quien lo creo puede verlo
                //console.log(ctx.usuario);
                if (cliente.vendedor.toString() !== ctx.usuario.id.toString()) {
                    throw new Error('No tienes acceso a este cliente');
                }
                return cliente;
            } catch (err) {
                console.log(err);
                throw new Error('Error al obtener el cliente: ' + err);
            }
        },
        obtenerPedidos: async() => {
            try {
                const pedidos = await Pedido.find({});
                return pedidos;
            } catch (err) {
                console.log(err);
                throw new Error('Error al obtener los pedidos: ' + err);
            }
        },
        obtenerPedidosVendedor: async(_, {}, ctx) => {
            try {
                const pedidos = await Pedido.find({ vendedor: ctx.usuario.id }).populate('cliente');
                return pedidos;
            } catch (err) {
                console.log(err);
                throw new Error('Error al obtener los pedidos');
            }
        },
        obtenerPedidoPorId: async(_, { id }, ctx) => {
            try {
                const pedido = await Pedido.findById(id);
                if (!pedido) {
                    throw new Error('Error pedido no existe');
                }
                //quien lo creo puede verlo
                //console.log(ctx.usuario);
                if (pedido.vendedor.toString() !== ctx.usuario.id.toString()) {
                    throw new Error('No tienes acceso a este pedido');
                }
                return pedido;
            } catch (err) {
                console.log(err);
                throw new Error('Error al obtener el cliente: ' + err);
            }
        },
        obtenerPedidosPorEstado: async(_, { estado }, ctx) => {
            try {
                const pedidos = await Pedido.find({ vendedor: ctx.usuario.id, estado: estado });
                return pedidos;
            } catch (err) {
                console.log(err);
                throw new Error('Error al obtener los pedidos');
            }
        },
        mejoresClientes: async() => {
            try {
                const clientes = await Pedido.aggregate([
                    { $match: { estado: "COMPLETADO" } },
                    {
                        $group: {
                            _id: "$cliente",
                            total: { $sum: '$total' }
                        }
                    },
                    {
                        $lookup: {
                            from: 'clientes',
                            localField: '_id',
                            foreignField: "_id",
                            as: "cliente"
                        }
                    },
                    {
                        $limit: 10
                    },
                    {
                        $sort: { total: -1 }
                    }
                ]);
                // console.log(clientes);
                return clientes;
            } catch (err) {
                console.log(err);
                throw new Error('Error al obtener los mejores clientes');
            }
        },
        mejoresVendedores: async() => {
            try {
                const vendedores = await Pedido.aggregate([
                    { $match: { estado: "COMPLETADO" } },
                    {
                        $group: {
                            _id: "$vendedor",
                            total: { $sum: '$total' }
                        }
                    },
                    {
                        $lookup: {
                            from: 'usuarios',
                            localField: '_id',
                            foreignField: "_id",
                            as: "vendedor"
                        }
                    },
                    {
                        $limit: 5
                    },
                    {
                        $sort: { total: -1 }
                    }
                ]);
                return vendedores;
            } catch (err) {
                console.log(err);
                throw new Error('Error al obtener los mejores clientes');
            }
        },
        buscarProductos: async(_, { texto }) => {
            const productos = await Producto.find({ $text: { $search: texto } });
            return productos;
        }
    },
    Mutation: {
        //el segundo parametro lleva el input, el tercero el context
        nuevoUsuario: async(_, { input }) => {
            const { email, password } = input;
            //Revisar si el usuario ya esta registrado
            let existeUsuario = await Usuario.findOne({ email });
            if (!existeUsuario) {
                //Hashear el password
                const salt = await bcrypjs.genSaltSync(10);
                input.password = await bcrypjs.hash(password, salt);
                //Guardar en DB
                try {
                    let usuario = new Usuario(input);
                    await usuario.save();
                    return usuario;
                } catch (err) {
                    throw new Error("Error al guardar el usuario");
                }

            } else {
                throw new Error("El email ya esta registrado para otro usuario");
            }
        },
        autenticarUsuario: async(_, { input }) => {
            const { email, password } = input;
            //Si el usuario existe
            let existeUsuario = await Usuario.findOne({ email });
            if (!existeUsuario) {
                throw new Error("El usuario no esta registrado.");
            }

            if (!bcrypjs.compareSync(password, existeUsuario.password)) {
                throw new Error("El password es incorrecto.");
            }
            return {
                token: crearToken(existeUsuario, process.env.PALABRA_SECRETA, '24h')
            }
        },
        nuevoProducto: async(_, { input }) => {
            try {
                //  console.log("INPUT", input);


                const producto = new Producto(input);

                const resultado = await producto.save();
                return resultado;
            } catch (err) {
                console.log(err);
                throw new Error(err);
            }
        },

        actualizarProducto: async(_, { id, input }) => {
            let producto = await Producto.findById(id);
            if (!producto) {
                throw new Error('Error producto no existe');
            }

            try {
                producto = await Producto.findByIdAndUpdate({ _id: id }, input, { new: true });
            } catch (err) {
                console.log(err);
                throw new Error(err);
            }
            return producto;
        },
        eliminarProducto: async(_, { id }) => {
            let producto = await Producto.findById(id);
            if (!producto) {
                throw new Error('Error producto no existe');
            }
            await Producto.findByIdAndDelete(id);
            return "Producto eliminado";
        },
        nuevoCliente: async(_, { input }, ctx) => {
            try {
                const { email } = input;
                //Si el usuario existe
                let existeCliente = await Cliente.findOne({ email });
                if (existeCliente) {
                    throw new Error("El cliente ya esta registrado.");
                }
                const nuevoCliente = new Cliente(input);
                nuevoCliente.vendedor = ctx.usuario.id;
                //asignar el vendedor



                return await nuevoCliente.save();
            } catch (err) {
                console.log(err);
                throw new Error(err);
            }
        },
        actualizarCliente: async(_, { id, input }, ctx) => {
            let cliente = await Cliente.findById(id);
            if (!cliente) {
                throw new Error('Error cliente no existe');
            }
            try {
                if (cliente.vendedor.toString() !== ctx.usuario.id.toString()) {
                    throw new Error('No tienes acceso a actualizar este cliente');
                }
                cliente = await Cliente.findByIdAndUpdate({ _id: id }, input, { new: true });
            } catch (err) {
                console.log(err);
                throw new Error(err);
            }
            return cliente;
        },
        eliminarCliente: async(_, { id }, ctx) => {
            let cliente = await Cliente.findById(id);
            if (!cliente) {
                throw new Error('Error cliente no existe');
            }
            if (cliente.vendedor.toString() !== ctx.usuario.id.toString()) {
                throw new Error('No tienes acceso a eliminar este cliente');
            }
            await Cliente.findByIdAndDelete(id);
            return "Cliente eliminado";
        },
        //PEDIDOS
        nuevoPedido: async(_, { input }, ctx) => {
            const { cliente } = input;
            //veriifca rsi cliente existe
            let clienteExiste = await Cliente.findById(cliente);
            if (!clienteExiste) {
                throw new Error('Error cliente no existe');
            }
            //verificar si cliente es del vendedor
            if (clienteExiste.vendedor.toString() !== ctx.usuario.id.toString()) {
                throw new Error('No tienes acceso a utiliza este cliente');
            }
            //console.log("PASA POR ACA");
            //verificar que el stock este disponible
            for await (const articulo of input.pedido) {
                const { id } = articulo;

                let productoExiste = await Producto.findById(id);
                if (!productoExiste) {
                    throw new Error('Error producto no existe');
                }
                if (productoExiste.existencia < articulo.cantidad) {
                    throw new Error(`No existen suficientes ${productoExiste.nombre}  para completar el pedido`);
                } else {
                    //Restar la cantidad a lo disponible
                    productoExiste.existencia = productoExiste.existencia - articulo.cantidad;
                    await productoExiste.save();
                }
            };
            //Crear un nuevo pedido
            const nuevoPedido = new Pedido(input);
            //asignarle un vendedor
            nuevoPedido.vendedor = ctx.usuario.id;
            //guardar en DB
            const resultado = await nuevoPedido.save();

            return resultado;
        },
        actualizarPedido: async(_, { id, input }, ctx) => {
            console.log("LLEGA A METODO");

            const { cliente } = input;

            let pedido = await Pedido.findById(id);
            if (!pedido) {
                throw new Error('Error pedido no existe');
            }

            //veriifca rsi cliente existe
            let clienteExiste = await Cliente.findById(cliente);
            if (!clienteExiste) {
                throw new Error('Error cliente no existe');
            }
            //verificar si cliente es del vendedor
            if (clienteExiste.vendedor.toString() !== ctx.usuario.id.toString()) {
                throw new Error('No tienes acceso a utiliza este cliente');
            }
            console.log("VERIFICA EL PEDIDO");
            console.log("input.pedid: " +  input.pedido);
            //verificar que el stock este disponible
            if(input.pedido) {
                for await (const articulo of input.pedido) {
                    const { id } = articulo;
    
                    let productoExiste = await Producto.findById(id);
                    if (!productoExiste) {
                        throw new Error('Error producto no existe');
                    }
                    if (productoExiste.existencia < articulo.cantidad) {
                        throw new Error(`No existen suficientes ${productoExiste.nombre}  para completar el pedido`);
                    } else {
                        //Restar la cantidad a lo disponible
                        productoExiste.existencia = productoExiste.existencia - articulo.cantidad;
                        await productoExiste.save();
                    }
                };
            }
            
            console.log("CREAR NUEVO PEDIDO");
            //Crear un nuevo pedido
            pedido = new Pedido(input);
            //asignarle un vendedor
            pedido.vendedor = ctx.usuario.id;
            //guardar en DB
            console.log("POR GUARDAR");
            const resultado = await Pedido.findOneAndUpdate({ _id: id }, input, { new: true });
            console.log("GUARDA");
            return resultado;
        },
        eliminarPedido: async(_, { id }, ctx) => {
            let pedido = await Pedido.findById(id);
            if (!pedido) {
                throw new Error('Error pedido no existe');
            }
            if (pedido.vendedor.toString() !== ctx.usuario.id.toString()) {
                throw new Error('No tienes acceso a eliminar este pedido');
            }
            await Pedido.findByIdAndDelete(id);
            return "Pedido eliminado";
        },
    }
}

module.exports = resolvers;