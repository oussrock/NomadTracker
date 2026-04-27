import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Initialize Database
let db;
(async () => {
    db = await open({
        filename: './nomad_tracker.db',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company TEXT NOT NULL,
            role TEXT NOT NULL,
            market TEXT,
            salary_est TEXT,
            status TEXT DEFAULT 'pending', -- pending, applied, interview, offer, rejected
            url TEXT,
            date_applied DATE,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('Database initialized.');
})();

// API: Get all applications
app.get('/api/applications', async (req, res) => {
    const apps = await db.all('SELECT * FROM applications ORDER BY created_at DESC');
    res.json(apps);
});

// API: Add application
app.post('/api/applications', async (req, res) => {
    const { company, role, market, salary_est, status, url, date_applied, notes } = req.body;
    const result = await db.run(
        'INSERT INTO applications (company, role, market, salary_est, status, url, date_applied, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [company, role, market, salary_est, status, url, date_applied, notes]
    );
    res.json({ id: result.lastID });
});

// API: Update full application
app.put('/api/applications/:id', async (req, res) => {
    console.log(`Updating application ${req.params.id}:`, req.body);
    const { company, role, market, salary_est, status, url, date_applied, notes } = req.body;
    
    try {
        if (Object.keys(req.body).length === 1 && req.body.status) {
            await db.run('UPDATE applications SET status = ? WHERE id = ?', [status, req.params.id]);
        } else {
            await db.run(
                'UPDATE applications SET company = ?, role = ?, market = ?, salary_est = ?, status = ?, url = ?, date_applied = ?, notes = ? WHERE id = ?',
                [company, role, market, salary_est, status, url, date_applied, notes, req.params.id]
            );
        }
        console.log('Update successful');
        res.json({ success: true });
    } catch (err) {
        console.error('Update failed:', err);
        res.status(500).json({ error: err.message });
    }
});

// API: LinkedIn Extractor
app.post('/api/extract-linkedin', async (req, res) => {
    const { url } = req.body;
    if (!url || !url.includes('linkedin.com')) {
        return res.status(400).json({ error: 'Invalid LinkedIn URL' });
    }

    try {
        // LinkedIn often blocks axios/cheerio. In a real app, you'd use a proxy or Puppeteer.
        // For this prototype, we'll try a basic fetch with browser-like headers.
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        
        // Extracting common LinkedIn job patterns
        const jobTitle = $('h1').first().text().trim() || $('.top-card-layout__title').text().trim();
        const companyName = $('.topcard__flavor--bullet').first().prev().text().trim() || $('.top-card-layout__subtitle-subject').text().trim();
        const location = $('.topcard__flavor--bullet').first().text().trim() || $('.top-card-layout__first-subline').text().trim();

        res.json({
            role: jobTitle || '',
            company: companyName || '',
            market: location || 'USA/Canada',
            url: url
        });
    } catch (error) {
        console.error('LinkedIn extraction failed:', error.message);
        // Fallback: Just return the URL so the user can fill the rest if blocked
        res.json({ 
            role: '', 
            company: '', 
            market: 'USA/Canada', 
            url: url,
            warning: 'LinkedIn blocked automated extraction. Please fill details manually.'
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
