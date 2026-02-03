import React, { useEffect } from "react";
import AddTransaction from "../components/AddTransaction";
import TransactionList from "../components/TransactionList";
import Summary from "../components/Summary";
import LogoutButton from '../components/LogoutButton';

export default function HomePage() {
  useEffect(() => {
    fetch("/cashtracking/api/check", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          window.location.href = "/login";
        }
      })
      .catch(() => {
        window.location.href = "/login";
      });
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <LogoutButton />
      </div>

      <Summary />
      
      <div className="card">
        <AddTransaction onSuccess={() => window.location.reload()} />
      </div>

      <TransactionList />
    </div>
  );
}
