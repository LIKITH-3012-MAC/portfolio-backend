require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'Likith@2006',
    database: process.env.DB_NAME || 'likith_portfolio'
});

db.connect((err) => {
    if (err) console.error('DB Error:', err);
    else console.log('✅ Connected to MySQL Database.');
});

// Email Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 1. POST: Receive Message & Send Email
app.post('/submit-contact', (req, res) => {
    const { name, email, mobile, message } = req.body;

    const sql = 'INSERT INTO contact_logs (name, email, mobile, message) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, email, mobile, message], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Database Error' });
        }

        console.log('✅ New message saved to Database.');

        // Send Email Alert
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `🚀 Portfolio: Message from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nMobile: ${mobile}\nMessage: ${message}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.log('❌ Email failed:', error);
            else console.log('📧 Email alert sent.');
        });

        res.status(200).json({ success: true, message: 'Message Received' });
    });
});

// 2. GET: Fetch All Messages (For Admin Page)
app.get('/admin/messages', (req, res) => {
    const sql = 'SELECT * FROM contact_logs ORDER BY timestamp DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Database fetch error' });
        } else {
            res.status(200).json(results);
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
