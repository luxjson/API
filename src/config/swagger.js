const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    info: {
        title: 'LUXJSON API',
        description: 'Welcome to the official API documentation. <br/> **Note:** Endpoints marked with a lock require a valid JWT Token to execute.',
    },
    servers: [
      {
        url: 'https://luxjson.up.railway.app', // url de producao da api [api.luxjson.is-a.dev]
        description: 'LUXJSON API',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste your JWT token here',
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './server.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;