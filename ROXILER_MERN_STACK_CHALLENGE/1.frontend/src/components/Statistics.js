import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, CircularProgress } from '@mui/material';

const Statistics = ({ selectedMonth }) => {
    const [totalSales, setTotalSales] = useState(0);
    const [totalSold, setTotalSold] = useState(0);
    const [totalNotSold, setTotalNotSold] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // State to handle errors

    // Fetch statistics data from the API
    const fetchStatistics = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:5000/api/transactions/statistics`, {
                params: { month: selectedMonth },
            });
            setTotalSales(response.data.totalSales);
            setTotalSold(response.data.totalSoldItems);
            setTotalNotSold(response.data.totalNotSoldItems);
        } catch (err) {
            console.error("Error fetching statistics:", err); // Log error
            setError("Failed to load statistics. Please try again."); // Set error message
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatistics();
    }, [selectedMonth]);

    return (
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
            {loading ? (
                // Show loading spinner while fetching data
                <CircularProgress />
            ) : error ? (
                // Display error message if there is an error
                <Typography color="error">{error}</Typography>
            ) : (
                <>
                    <Card>
                        <CardContent>
                            <Typography variant="h5">Total Sales</Typography>
                            <Typography variant="h6">${totalSales.toFixed(2)}</Typography> {/* Display sales with two decimal places */}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <Typography variant="h5">Sold Items</Typography>
                            <Typography variant="h6">{totalSold}</Typography>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <Typography variant="h5">Not Sold Items</Typography>
                            <Typography variant="h6">{totalNotSold}</Typography>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
};

export default Statistics;
