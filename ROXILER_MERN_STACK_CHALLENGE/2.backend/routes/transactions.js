const express = require('express');
const axios = require('axios');
const Transaction = require('../models/Transaction');
const router = express.Router();
const { v4: uuidv4 } = require('uuid'); // Import UUID package
const { check, validationResult } = require('express-validator'); // Import express-validator

/**
 * @swagger
 * /api/transactions/initialize:
 *   get:
 *     summary: Initialize the database with transaction data
 *     description: Fetches transaction data from a remote API and populates the database.
 *     responses:
 *       200:
 *         description: Database initialized successfully
 *       500:
 *         description: Error initializing the database
 */
const testDataSource = async () => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        console.log('Data fetched successfully:', response.data);
        return response.data; // Return the fetched data
    } catch (error) {
        console.error('Error fetching data:', error.message);
        throw new Error('Failed to fetch data from the source'); // More descriptive error
    }
};

router.get('/initialize', async (req, res) => {
    console.log("Initialization started...");

    try {
        const data = await testDataSource(); // Use the testDataSource function
        console.log(`Fetched ${data.length} records from the data source.`);

        // Prepare transaction data
        const transactions = data.map(item => ({
            id: uuidv4(), // Generate a unique ID
            title: item.title,
            description: item.description,
            price: Number(item.price), // Ensure price is a number
            category: item.category,
            sold: item.sold || false, // Defaults to false if sold property is missing
            dateOfSale: new Date(item.dateOfSale), // Ensure date is properly formatted
            image: item.image,
        }));

        // Clear existing transactions
        const deleteResult = await Transaction.deleteMany({});
        console.log(`${deleteResult.deletedCount} records deleted from the database.`);

        // Insert new transactions
        const insertResult = await Transaction.insertMany(transactions);
        console.log(`${insertResult.length} records inserted successfully.`);

        res.json({
            message: 'Database initialized successfully!',
            initializedCount: insertResult.length
        });
    } catch (error) {
        console.error('Error initializing database:', error.message);
        res.status(500).json({
            error: 'Error initializing database.',
            details: error.message
        });
    }
});

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: List transactions
 *     description: Retrieve a list of transactions with optional filtering by month, pagination, and search.
 *     parameters:
 *       - in: query
 *         name: month
 *         required: false
 *         description: Month to filter transactions (default is January)
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number for pagination (default is 1)
 *         schema:
 *           type: integer
 *       - in: query
 *         name: perPage
 *         required: false
 *         description: Number of transactions per page (default is 10)
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         required: false
 *         description: Search term for filtering transactions
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of transactions with total count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 total:
 *                   type: integer
 *       500:
 *         description: Error fetching transactions
 */
router.get('/', async (req, res) => {
    const { month = 'January', page = 1, perPage = 10, search = '' } = req.query;

    // Log the input parameters
    console.log(`Fetching transactions for month: ${month}, page: ${page}, perPage: ${perPage}, search: ${search}`);

    // Parse and validate the month
    const monthIndex = new Date(Date.parse(`${month} 1`)).getMonth(); // Get month index (0 for January, 1 for February, etc.)

    // Check if monthIndex is valid
    if (isNaN(monthIndex)) {
        return res.status(400).json({ error: `Invalid month value: ${month}` });
    }

    const regex = new RegExp(search, 'i'); // Case-insensitive search

    try {
        // Fetch transactions for the specified month of any year, page, and search criteria
        const transactions = await Transaction.find({
            $expr: {
                $eq: [{ $month: "$dateOfSale" }, monthIndex + 1] // Check if the month matches (add 1 because $month is 1-indexed)
            },
            $or: [
                { title: regex },
                { description: regex }
            ]
        })
        .skip((page - 1) * perPage) // Apply pagination
        .limit(perPage); // Limit the number of results per page

        // Count total matching transactions for pagination
        const total = await Transaction.countDocuments({
            $expr: {
                $eq: [{ $month: "$dateOfSale" }, monthIndex + 1] // Check if the month matches
            },
            $or: [
                { title: regex },
                { description: regex }
            ]
        });

        // Log fetched results for debugging
        console.log(`Fetched ${transactions.length} transactions, Total count: ${total}`);

        // Return the transactions along with the total count for pagination
        res.json({ transactions, total });
    } catch (error) {
        console.error('Error fetching transactions:', error.message);
        res.status(500).json({ error: 'Error fetching transactions.', details: error.message });
    }
});


/**
 * @swagger
 * /api/transactions/statistics:
 *   get:
 *     summary: Get sales statistics for a specific month
 *     description: Calculates total sales and item counts based on the specified month.
 *     parameters:
 *       - in: query
 *         name: month
 *         required: false
 *         description: Month to calculate statistics for (default is January)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sales statistics for the specified month
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSales:
 *                   type: number
 *                 totalSoldItems:
 *                   type: integer
 *                 totalNotSoldItems:
 *                   type: integer
 *       500:
 *         description: Error fetching statistics
 */
router.get('/statistics', async (req, res) => {
    const { month = 'November' } = req.query; // Month from query, year is no longer needed
    const monthIndex = new Date(Date.parse(`${month} 1`)).getMonth(); // Parse month from query

    // Check if monthIndex is valid
    if (isNaN(monthIndex)) {
        return res.status(400).json({ error: `Invalid month value: ${month}` });
    }

    console.log(`Fetching statistics for month: ${month}, Month Index: ${monthIndex}`);

    try {
        // Aggregation query to fetch total sales and sold status
        const totalSales = await Transaction.aggregate([
            { 
                $match: { 
                    $expr: { // Use $expr to compare the month directly
                        $eq: [{ $month: "$dateOfSale" }, monthIndex + 1] // +1 because $month is 1-indexed
                    }
                } 
            },
            { 
                $group: { 
                    _id: null, 
                    total: { $sum: "$price" }, // Sum of prices for total sales
                    count: { $sum: 1 }, // Count of total items
                    sold: { $sum: { $cond: ["$sold", 1, 0] } } // Count of sold items
                } 
            }
        ]);

        console.log('Aggregated total sales:', totalSales);

        // Calculate total sold and not sold items
        const totalSoldItems = totalSales[0] ? totalSales[0].sold : 0;
        const totalNotSoldItems = totalSales[0] ? totalSales[0].count - totalSoldItems : 0;

        console.log(`Total Sales: ${totalSales[0]?.total || 0}, Total Sold Items: ${totalSoldItems}, Total Not Sold Items: ${totalNotSoldItems}`);

        // Send the result in JSON format
        res.json({ 
            totalSales: totalSales[0]?.total || 0, 
            totalSoldItems, 
            totalNotSoldItems 
        });
    } catch (error) {
        console.error('Error fetching statistics:', error.message);
        res.status(500).json({ error: 'Error fetching statistics.', details: error.message });
    }
});


/**
 * @swagger
 * /api/transactions/bar-chart:
 *   get:
 *     summary: Get data for bar chart based on price ranges
 *     description: Provides aggregated transaction data into price buckets for bar chart visualization.
 *     parameters:
 *       - in: query
 *         name: month
 *         required: false
 *         description: Month to filter transactions (default is January)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bar chart data based on price ranges
 *       500:
 *         description: Error fetching bar chart data
 */
router.get('/bar-chart', async (req, res) => {
    const { month = 'January' } = req.query; // Month from query, year is no longer needed
    const monthIndex = new Date(Date.parse(`${month} 1`)).getMonth(); // Parse month from query

    // Check if monthIndex is valid
    if (isNaN(monthIndex)) {
        return res.status(400).json({ error: `Invalid month value: ${month}` });
    }

    console.log(`Fetching bar chart data for month: ${month}`);

    try {
        // Aggregation pipeline to fetch the bar chart data
        const data = await Transaction.aggregate([
            { 
                $match: { 
                    $expr: { // Use $expr to match any year
                        $eq: [{ $month: "$dateOfSale" }, monthIndex + 1] // +1 because $month is 1-indexed
                    }
                } 
            },
            { 
                $bucket: {
                    groupBy: "$price", // Group by the price field
                    boundaries: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000], // Price range boundaries
                    default: "Other", // Default bucket for prices outside boundaries
                    output: {
                        count: { $sum: 1 } // Count the number of transactions in each bucket
                    }
                }
            }
        ]);

        // Log the data returned from the aggregation
        console.log('Bar chart data:', data);

        res.json(data); // Send the data as a JSON response
    } catch (error) {
        console.error('Error fetching bar chart data:', error.message);
        res.status(500).json({ error: 'Error fetching bar chart data.', details: error.message });
    }
});


/*
 * @swagger
 * /api/transactions/pie-chart:
 *   get:
 *     summary: Get data for pie chart based on sold status
 *     description: Provides aggregated transaction data based on sold and not sold status for pie chart visualization.
 *     parameters:
 *       - in: query
 *         name: month
 *         required: false
 *         description: Month to filter transactions (default is January)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pie chart data based on sold status
 *       500:
 *         description: Error fetching pie chart data
 */
router.get('/pie-chart', async (req, res) => {
    const { month = 'January' } = req.query; // Month from query, year is no longer needed
    const monthIndex = new Date(Date.parse(`${month} 1`)).getMonth(); // Parse month from query

    // Check if monthIndex is valid
    if (isNaN(monthIndex)) {
        return res.status(400).json({ error: `Invalid month value: ${month}` });
    }

    // Log the input month parameter
    console.log(`Fetching pie chart data for month: ${month}`);

    try {
        // Define the date range
        const startDate = new Date(new Date().getFullYear(), monthIndex, 1); // Use current year
        const endDate = new Date(new Date().getFullYear(), monthIndex + 1, 1);

        const data = await Transaction.aggregate([
            { 
                $match: { 
                    $expr: { // Match any year
                        $eq: [{ $month: "$dateOfSale" }, monthIndex + 1] // +1 because $month is 1-indexed
                    }
                } 
            },
            { 
                $group: {
                    _id: "$sold", // Group by the sold status
                    count: { $sum: 1 } // Count the number of transactions for each sold status
                }
            }
        ]);

        // Log the data returned from the aggregation
        console.log('Pie chart data:', data);

        res.json(data); // Send the data as a JSON response
    } catch (error) {
        console.error('Error fetching pie chart data:', error.message);
        res.status(500).json({ error: 'Error fetching pie chart data.', details: error.message });
    }
});


module.exports = router;

