require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000; // Render sets its own PORT

app.use(cors());
app.use(bodyParser.json());

// MySQL Connection (Updated for Cloud SSL)
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    }
});

db.connect((err) => {
    if (err) console.error('DB Error:', err);
    else {
        console.log('✅ Connected to Cloud Database.');
        // Create table if it doesn't exist (Auto-setup for Cloud)
        const sql = `CREATE TABLE IF NOT EXISTS contact_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            mobile VARCHAR(20),
            message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;
        db.query(sql, (err) => {
            if(err) console.error("Table creation failed:", err);
            else console.log("✅ Table ready.");
        });
    }
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/submit-contact', (req, res) => {
    const { name, email, mobile, message } = req.body;
    const sql = 'INSERT INTO contact_logs (name, email, mobile, message) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, email, mobile, message], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false });
        }
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `🚀 Cloud Msg: ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nMobile: ${mobile}\nMessage: ${message}`
        };
        transporter.sendMail(mailOptions, (error) => {
            if (error) console.log('❌ Email failed');
        });

        res.status(200).json({ success: true });
    });
});

app.get('/admin/messages', (req, res) => {
    const sql = 'SELECT * FROM contact_logs ORDER BY timestamp DESC';
    db.query(sql, (err, results) => {
        if (err) res.status(500).json({ error: 'DB Error' });
        else res.status(200).json(results);
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
