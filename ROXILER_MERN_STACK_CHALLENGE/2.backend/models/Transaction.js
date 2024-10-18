const mongoose = require('mongoose');

// Define the Transaction schema with enhanced validation and type specifications
const TransactionSchema = new mongoose.Schema({
    id: { 
        type: String, 
        required: true, 
        unique: true // Ensure that the id is unique
    },
    title: { 
        type: String, 
        required: [true, 'Title is required'] // Custom error message for required field
    },
    description: { 
        type: String, 
        required: [true, 'Description is required'] // Custom error message for required field
    },
    price: { 
        type: Number, 
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'], // Ensures price cannot be negative with custom error message
        validate: {
            validator: Number.isFinite, // Validates that the value is a finite number
            message: props => `${props.value} is not a valid number!`
        }
    },
    category: { 
        type: String, 
        required: [true, 'Category is required'] // Custom error message for required field
    },
    sold: { 
        type: Boolean, 
        required: [true, 'Sold status is required'], // Custom error message for required field
        default: false // Default value for sold status
    },
    dateOfSale: { 
        type: Date, 
        required: true,
        default: Date.now // Set a default date if not provided, if applicable
    },
    image: { 
        type: String, 
        required: [true, 'Image URL is required'], // Custom error message for required field
        validate: {
            validator: function(v) {
                // Simple regex for URL validation
                return /^(http|https):\/\/[^ "]+$/.test(v);
            },
            message: props => `${props.value} is not a valid URL!`
        }
    },
});

// Create and export the model
module.exports = mongoose.model('Transaction', TransactionSchema);
