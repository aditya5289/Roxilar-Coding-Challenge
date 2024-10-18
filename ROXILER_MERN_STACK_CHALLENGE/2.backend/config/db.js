const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Function to connect to MongoDB
const connectDB = async () => {
    try {
        // Connect to MongoDB using the connection URI from environment variables
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true, // Use the new URL string parser
            useUnifiedTopology: true // Use the new Server Discover and Monitoring engine
            // Removed useCreateIndex and useFindAndModify options
        });
        console.log('MongoDB Connected'); // Log successful connection
    } catch (error) {
        // Log the error and exit the process if the connection fails
        console.error('MongoDB connection failed:', error.message); 
        process.exit(1);
    }
};

// Export the connection function for use in other modules
module.exports = connectDB;
