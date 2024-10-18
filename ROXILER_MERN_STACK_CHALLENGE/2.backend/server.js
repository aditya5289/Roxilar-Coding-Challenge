// Import required packages
const express = require('express'); // Web framework for Node.js
const mongoose = require('mongoose'); // MongoDB object modeling tool
const cors = require('cors'); // Middleware for enabling CORS
const bodyParser = require('body-parser'); // Middleware for parsing request bodies
const dotenv = require('dotenv'); // Module to load environment variables
const connectDB = require('./config/db'); // Database connection utility
const transactionRoutes = require('./routes/transactions'); // Routes for transaction API

// Import Swagger packages for API documentation
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Load environment variables from .env file
dotenv.config();

// Create an instance of Express
const app = express();

// Define the port to listen on
const PORT = process.env.PORT || 5000;

// Connect to the database
connectDB();

// Swagger configuration options
const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0", // OpenAPI version
        info: {
            title: "Transaction API", // Title of the API
            version: "1.0.0", // Version of the API
            description: "API documentation for managing transactions", // Description of the API
            contact: {
                name: "Support", // Contact name for API support
                email: "support@example.com", // Contact email for API support
            },
        },
        servers: [
            {
                url: `http://localhost:${PORT}`, // URL for the API server
            },
        ],
    },
    apis: ["./routes/*.js"], // Path to the API documentation files
};

// Initialize Swagger
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs)); // Serve Swagger UI documentation

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse JSON request bodies

// Define routes for the application
app.use('/api/transactions', transactionRoutes); // Use transaction routes

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack); // Log error stack trace
    res.status(500).json({ error: 'Something went wrong!' }); // Send error response
});

// Start the server and listen on the defined port
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`); // Log server startup message
});
