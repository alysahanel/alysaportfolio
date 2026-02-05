import React, { useEffect, useState } from 'react';

const Summary = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch('/cashtracking/api/transactions', {
      credentials: 'include',
    })
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
           const data = await res.json();
           setTransactions(data || []);
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
