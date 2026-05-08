import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.1",
    info: {
      title: "My API",
      version: "v1",
    },
  },

apis: ["./app/api/*/.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;