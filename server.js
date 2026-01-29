require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// --- 1. Middleware ---
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(express.json());

// --- 2. Rate Limiting (Traffic Control) ---
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { error: "Too many requests, please try again later." }
});
app.use('/api', limiter);

// --- 3. Database Connection (The "Crash Proof" Pool) ---
const dbUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.split('?')[0] : '';

const pool = mysql.createPool({
    uri: dbUrl,
    waitForConnections: true,
    connectionLimit: 5, // Lower limit for stability on Free Tier
    queueLimit: 0,
    enableKeepAlive: true, // <--- CRITICAL FIX: Keeps the line open
    keepAliveInitialDelay: 0,
    ssl: { rejectUnauthorized: false }
});

// Test the connection immediately on startup
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Database Connection Failed:", err.message);
    } else {
        console.log("✅ Connected to Aiven Cloud Database successfully!");
        connection.release(); // Always release the connection back to the pool
    }
});

// Keep-Alive Loop: Pings the DB every 60 seconds to prevent "Closed State" error
setInterval(() => {
    pool.query('SELECT 1', (err) => {
        if (err) console.error('⚠️ Keep-alive ping failed:', err.message);
    });
}, 60000); 

// --- 4. Routes ---
app.get('/', (req, res) => res.send('Likith Portfolio Backend is Live & Stable! 🚀'));

app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const sql = 'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)';
    
    // Using pool.execute handles the connection release automatically
    pool.execute(sql, [name, email, message], (err, result) => {
        if (err) {
            console.error("❌ Insert Error:", err);
            return res.status(500).json({ error: 'Failed to save message' });
        }
        res.json({ success: true, message: 'Message Saved to Cloud!' });
    });
});

// --- 5. Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
