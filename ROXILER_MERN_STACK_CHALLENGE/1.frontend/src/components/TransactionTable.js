import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Pagination, CircularProgress } from '@mui/material';

const TransactionTable = ({ selectedMonth }) => {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState('');

    // Fetch transactions from the API
    const fetchTransactions = async () => {
        try {
            setLoading(true);
            console.log(`Fetching transactions for ${selectedMonth}, page ${page}, perPage ${perPage}, search "${search}"`); // Log the API call
            const response = await axios.get(`http://localhost:5000/api/transactions`, {
                params: { month: selectedMonth, page, perPage, search }
            });
            setTransactions(response.data.transactions);
            setTotal(response.data.total);
        } catch (error) {
            console.error("Error fetching transactions:", error); // Log errors
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [page, selectedMonth, search]);

    return (
        <div>
            <TextField
                label="Search"
                variant="outlined"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ marginBottom: '20px' }}
            />
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Sold</TableCell>
                            <TableCell>Date of Sale</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} style={{ textAlign: 'center' }}>
                                    <CircularProgress /> {/* Show loading spinner */}
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.length > 0 ? (
                                transactions.map((transaction) => (
                                    <TableRow key={transaction._id}>
                                        <TableCell>{transaction.title}</TableCell>
                                        <TableCell>{transaction.description}</TableCell>
                                        <TableCell>${transaction.price}</TableCell>
                                        <TableCell>{transaction.category}</TableCell>
                                        <TableCell>{transaction.sold ? 'Yes' : 'No'}</TableCell>
                                        <TableCell>{new Date(transaction.dateOfSale).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} style={{ textAlign: 'center' }}>
                                        No transactions found. {/* Handle empty results */}
                                    </TableCell>
                                </TableRow>
                            )
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Pagination
                count={Math.ceil(total / perPage)}
                page={page}
                onChange={(e, value) => setPage(value)}
                style={{ marginTop: '20px' }}
            />
        </div>
    );
};

export default TransactionTable;
