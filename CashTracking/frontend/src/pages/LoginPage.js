import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch("/cashtracking/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (res.ok) {
          onLogin();
          navigate("/");
          return;
        } else {
          alert(data.message);
          return;
        }
      }
    } catch (error) {
      console.log("API unavailable, trying mock login...");
    }

    // Fallback: Mock Login for Static Demo
    if (form.username === "demo" && form.password === "demo123") {
      localStorage.setItem("cashtracking_user", "demo");
      onLogin();
      navigate("/");
    } else {
      alert("Login failed. For demo, use User: demo, Pass: demo123");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <form onSubmit={handleLogin}>
          <h2>Welcome Back</h2>
          
          <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: '#555', background: 'rgba(255,255,255,0.9)', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Demo Credentials:</p>
            <p style={{ margin: '2px 0' }}>User: <strong>demo</strong> | Pass: <strong>demo123</strong></p>
          </div>

          <input placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
          <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          <button type="submit">Login</button>


          <div className="auth-link">
            <p>Don't have an account? <Link to="/register">Register</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}
