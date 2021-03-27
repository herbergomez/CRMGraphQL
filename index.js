const { ApolloServer } = require('apollo-server');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');
const conectarDB = require('./config/db');
const jwt = require('jsonwebtoken');
//conectar a la base de datos
conectarDB();
//servidor
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
       // console.log(req.headers);
        const token = req.headers["authorization"] || '';
        if (token) {
            try {
                const usuario = jwt.verify(token.replace('Bearer ',''), process.env.PALABRA_SECRETA);
                //console.log(usuario);
                return {
                    usuario
                };

            } catch (err) {
                console.log("Hubo un error: ", err);
            }
        }
    }
});

//arrancar el servidor
server.listen({port: process.env.PORT || 4000}).then(({ url }) => {
    console.log(`Servidor listo en la URL ${url}`)
})