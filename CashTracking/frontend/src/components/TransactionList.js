import React, { useEffect, useState } from 'react';

const TransactionList = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch('/cashtracking/api/transactions', {
      credentials: 'include',
    })
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
           const data = await res.json();
           setTransactions(data);
        } else {
           throw new Error("Not JSON");
        }
      })
      .catch((err) => {
        console.error('Failed to fetch', err);
        // Fallback Mock Data for Demo
        setTransactions([
          { id: 1, type: 'Income', category: 'Salary', amount: 5000000, description: 'Monthly Salary (Demo)', date: new Date().toISOString() },
          { id: 2, type: 'Expense', category: 'Food', amount: 45000, description: 'Lunch (Demo)', date: new Date(Date.now() - 86400000).toISOString() },
          { id: 3, type: 'Expense', category: 'Transport', amount: 25000, description: 'Taxi (Demo)', date: new Date(Date.now() - 172800000).toISOString() }
        ]);
      });
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
