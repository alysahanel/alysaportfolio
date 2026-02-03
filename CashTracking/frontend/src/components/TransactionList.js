import React, { useEffect, useState } from 'react';

const TransactionList = () => {
  const [transactions, setTransactions] = useState([]);

useEffect(() => {
  fetch('/cashtracking/api/transactions', {
    credentials: 'include',
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Dari backend:", data); 
      setTransactions(data);
    })
    .catch((err) => console.error('Failed to fetch', err));
}, []);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  const formatDateTime = (datetimeString) => {
    const date = new Date(datetimeString);

    const options = {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };

    return date.toLocaleString('id-ID', options); 
  };

  return (
    <div className="transaction-list">
      <h3 style={{ padding: '1.5rem 1.5rem 0', marginTop: 0 }}>Recent Transactions</h3>
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        {transactions.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: '2rem' }}>No transactions found.</p>
        ) : (
          <div>
            {transactions.map((transaction, index) => (
              <div key={index} className="transaction-item">
                <div className="t-info">
                  <h4>{transaction.category}</h4>
                  <p>{formatDateTime(transaction.date)} • {transaction.description}</p>
                </div>
                <div className={`t-amount ${transaction.type.toLowerCase()}`}>
                  {transaction.type === 'Expense' ? '-' : '+'} {formatRupiah(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionList;
