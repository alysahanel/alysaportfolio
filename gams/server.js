const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.JWT_SECRET || 'ga_system_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

const router = express.Router();

router.use('/api', require('./src/routes/api'));
router.use(express.static(path.join(__dirname, 'public')));
router.use('/public', express.static(path.join(__dirname, 'public'))); // Support for local-style paths
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

router.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

router.get('/stock', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stock.html'));
});

router.get('/requests', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'requests.html'));
});

router.get('/calendar', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'calendar.html'));
});

router.get('/accounts', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'accounts.html'));
});

router.get('/stock-report', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stock-report.html'));
});

router.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Mount router for both root and /gams path (for Vercel rewrite)
app.use('/', router);
app.use('/gams', router);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;