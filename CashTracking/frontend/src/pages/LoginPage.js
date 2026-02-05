import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch("/cashtracking/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      onLogin();
      navigate("/");
    } else {
      alert(data.message);
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
