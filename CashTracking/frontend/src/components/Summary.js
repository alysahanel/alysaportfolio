import React, { useEffect, useState } from 'react';

const Summary = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch('/cashtracking/api/transactions', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => setTransactions(data || []))
      .catch((err) => console.error('Failed to fetch', err));
  }, []);

  const totalIncome = transactions
    .filter((t) => t.type === 'Income')
    .reduce((acc, cur) => acc + Number(cur.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'Expense')
    .reduce((acc, cur) => acc + Number(cur.amount), 0);

  const balance = totalIncome - totalExpense;

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="summary-cards">
      <div className="summary-card income">
        <h4>Total Income</h4>
        <p className="summary-value income">{formatRupiah(totalIncome)}</p>
      </div>
      <div className="summary-card expense">
        <h4>Total Expense</h4>
        <p className="summary-value expense">{formatRupiah(totalExpense)}</p>
      </div>
      <div className="summary-card">
        <h4>Current Balance</h4>
        <p className="summary-value" style={{ color: balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
          {formatRupiah(balance)}
        </p>
      </div>
    </div>
  );
};

export default Summary;
