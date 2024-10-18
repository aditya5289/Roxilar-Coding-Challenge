import React, { useState } from 'react';
import TransactionTable from '../components/TransactionTable';
import Statistics from '../components/Statistics';
import BarChart from '../components/BarChart';
import { Container, Typography, TextField } from '@mui/material';

// Define the Dashboard component
const Dashboard = () => {
    // State to manage the selected month
    const [selectedMonth, setSelectedMonth] = useState('January');

    // Handler for month selection change
    const handleMonthChange = (event) => {
        const selectedValue = event.target.value;
        console.log(`Month selected: ${selectedValue}`); // Log the selected month
        setSelectedMonth(selectedValue);
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Transaction Dashboard
            </Typography>
            <TextField
                select
                label="Select Month"
                value={selectedMonth}
                onChange={handleMonthChange} // Use the handler function
                SelectProps={{
                    native: true,
                }}
                variant="outlined"
                style={{ marginBottom: '20px' }}
            >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month) => (
                    <option key={month} value={month}>{month}</option>
                ))}
            </TextField>
            <Statistics selectedMonth={selectedMonth} />
            <BarChart selectedMonth={selectedMonth} />
            <TransactionTable selectedMonth={selectedMonth} />
        </Container>
    );
};

// Export the Dashboard component
export default Dashboard;
