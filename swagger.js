const swaggerAutogen = require("swagger-autogen")();

const outputFile = "./swagger_output.json";
const endpointsFiles = ["./index.js"];
//base url will be /
swaggerAutogen(outputFile, endpointsFiles);
