import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import { CircularProgress, Typography } from '@mui/material';
import { Chart, registerables } from 'chart.js';

// Register all necessary components and scales from Chart.js
Chart.register(...registerables);

const BarChart = ({ selectedMonth }) => {
    const [data, setData] = useState({ labels: [], datasets: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // State to handle errors

    // Fetch bar chart data from the API
    const fetchBarData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:5000/api/transactions/bar-chart`, {
                params: { month: selectedMonth },
            });
            const chartData = {
                labels: response.data.map(item => item._id), // Assuming _id is the label
                datasets: [
                    {
                        label: 'Number of Transactions',
                        data: response.data.map(item => item.count), // Assuming count is the data point
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                    },
                ],
            };
            setData(chartData);
        } catch (err) {
            console.error("Error fetching bar chart data:", err); // Log error
            setError("Failed to load chart data. Please try again."); // Set error message
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBarData();
    }, [selectedMonth]);

    return (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
            {loading ? (
                <CircularProgress /> // Show loading spinner
            ) : error ? (
                <Typography color="error">{error}</Typography> // Display error message
            ) : (
                <Bar data={data} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                        },
                    },
                }} />
            )}
        </div>
    );
};

export default BarChart;
