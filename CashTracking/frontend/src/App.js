import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/cashtracking/api/check", {
          credentials: "include"
        });
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          setLoggedIn(res.ok);
        } else {
          // Fallback for static hosting (Netlify) where API returns HTML
          setLoggedIn(localStorage.getItem("cashtracking_user") !== null);
        }
      } catch (e) {
        setLoggedIn(localStorage.getItem("cashtracking_user") !== null);
      }
    };
    checkAuth();
  }, []);

  return (
    <Router basename="/cashtracking">
      <Routes>
        <Route path="/login" element={
          loggedIn ? <Navigate to="/" /> : <LoginPage onLogin={() => setLoggedIn(true)} />
        } />
        <Route path="/register" element={
          loggedIn ? <Navigate to="/" /> : <RegisterPage />
        } />
        <Route path="/" element={
          loggedIn ? <HomePage /> : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}
