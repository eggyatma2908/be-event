import swaggerAutogen from "swagger-autogen";

const outputFile = "./swagger_output.json";
const endpointFiles = ["../routes/api.ts"];
const doc = {
    info: {
        version: "0.0.1",
        title: "Dokumentasi API Event",
        description: "Dokumentasi API Event"
    },
    servers: [
        {
            url: "http://localhost:3000/api",
            description: "Local Server"
        },
        {
            url: "https://be-event-ten.vercel.app/",
            description: "Deploy Server"
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer"
            }
        },
        schemas: {
            registerRequest: {
                fullName: "John Doe",
                username: "johndoe",
                email: "johndoe123@gmail.com",
                password: "Welcome123",
                confirmPassword: "Welcome123"
            },
            loginRequest: {
                identifier: "johndoe",
                password: "Welcome123"
            },
            activationRequest: {
                code: "abcd"
            }
        }
    }
}

swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointFiles, doc);