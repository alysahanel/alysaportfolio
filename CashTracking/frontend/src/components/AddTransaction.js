import React, { useState } from "react";

export default function AddTransaction({ onSuccess }) {
  const [form, setForm] = useState({
    type: "Income",
    amount: "",
    category: "",
    description: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/cashtracking/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });

    if (res.ok) {
      onSuccess();
      setForm({ ...form, amount: "", description: "" });
    } else {
      alert("Failed to add transaction");
    }
  };

  const categories = form.type === "Income"
    ? ["Salary", "Gift", "Other"]
    : ["Food", "Transport", "Groceries", "Rent", "Bill", "Other"];

  return (
    <form onSubmit={handleSubmit} className="add-transaction-form">
      <h3 style={{ gridColumn: 'span 2', marginBottom: '1rem' }}>Add New Transaction</h3>
      
      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
        <option>Income</option>
        <option>Expense</option>
      </select>
      
      <input
        type="number"
        placeholder="Amount"
        value={form.amount}
        onChange={e => setForm({ ...form, amount: e.target.value })}
        required
      />
      
      <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
        <option value="" disabled>Select Category</option>
        {categories.map(cat => <option key={cat}>{cat}</option>)}
      </select>
      
      <input
        type="text"
        placeholder="Description (Optional)"
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
      />
      
      <button type="submit">Add Transaction</button>
    </form>
  );
}
