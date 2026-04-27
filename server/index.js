import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// Initialize Database
const db = new Database('./nomad_tracker.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company TEXT NOT NULL,
        role TEXT NOT NULL,
        market TEXT,
        salary_est TEXT,
        status TEXT DEFAULT 'pending',
        url TEXT,
        date_applied DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`);
console.log('Database initialized.');

// API: Get all applications
app.get('/api/applications', (req, res) => {
    try {
        const apps = db.prepare('SELECT * FROM applications ORDER BY created_at DESC').all();
        res.json(apps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Add application
app.post('/api/applications', (req, res) => {
    try {
        const { company, role, market, salary_est, status, url, date_applied, notes } = req.body;
        const stmt = db.prepare(
            'INSERT INTO applications (company, role, market, salary_est, status, url, date_applied, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        const result = stmt.run(company, role, market, salary_est, status, url, date_applied, notes);
        res.json({ id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Update full application
app.put('/api/applications/:id', (req, res) => {
    console.log(`Updating application ${req.params.id}:`, req.body);
    const { company, role, market, salary_est, status, url, date_applied, notes } = req.body;

    try {
        if (Object.keys(req.body).length === 1 && req.body.status) {
            db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, req.params.id);
        } else {
            db.prepare(
                'UPDATE applications SET company = ?, role = ?, market = ?, salary_est = ?, status = ?, url = ?, date_applied = ?, notes = ? WHERE id = ?'
            ).run(company, role, market, salary_est, status, url, date_applied, notes, req.params.id);
        }
        console.log('Update successful');
        res.json({ success: true });
    } catch (err) {
        console.error('Update failed:', err);
        res.status(500).json({ error: err.message });
    }
});

// API: Delete application
app.delete('/api/applications/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
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
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
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
        res.json({
            role: '', company: '', market: 'USA/Canada', url: url,
            warning: 'LinkedIn blocked automated extraction.'
        });
    }
});

// Catch-all: serve React app for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
