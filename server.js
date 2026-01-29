require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// NEW: Import Google AI
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(compression());
app.use(helmet());
app.use(cors());
app.use(express.json());

// --- Rate Limiting ---
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { error: "Too many requests, please try again later." }
});
app.use('/api', limiter);

// --- AI Setup (The Brain of Prometheus) ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- Database Connection ---
const dbUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.split('?')[0] : '';
const pool = mysql.createPool({
    uri: dbUrl,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: { rejectUnauthorized: false }
});

// --- Keep-Alive Loop ---
setInterval(() => {
    pool.query('SELECT 1', (err) => {
        if (err) console.error('⚠️ Keep-alive ping failed:', err.message);
    });
}, 60000); 

// --- ROUTES ---

// 1. Chat Route (The New Feature)
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    if (!message) return res.status(400).json({ error: "Message required" });

    try {
        // The "System Prompt" - This gives the AI its personality
        const prompt = `
            You are Prometheus AI, a virtual assistant created by Likith Naidu.
            Likith is an AI-ML Architect and Full Stack Engineer.
            Answer questions briefly and professionally about his portfolio.
            If asked about skills, mention Python, Java, and Prometheus AI.
            User: ${message}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        res.json({ reply: text });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Prometheus is offline temporarily." });
    }
});

// 2. Contact Route (Existing)
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'All fields required' });

    const sql = 'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)';
    pool.execute(sql, [name, email, message], (err, result) => {
        if (err) {
            console.error("Insert Error:", err);
            return res.status(500).json({ error: 'Failed to save' });
        }
        res.json({ success: true, message: 'Message Saved!' });
    });
});

app.get('/', (req, res) => res.send('Prometheus AI Backend Online 🚀'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
