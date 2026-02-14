const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Static files
app.use(express.static('public'));

// 1. Survey Start Redirect
app.get('/start', async (req, res) => {
    const { pid, uid } = req.query; // pid example: VRR8042
    try {
        const result = await pool.query('SELECT base_url, status FROM projects WHERE project_code = $1', [pid]);
        if (result.rows.length > 0 && result.rows[0].status === 'active') {
            await pool.query('INSERT INTO responses (project_id, uid, status, ip) VALUES ($1, $2, $3, $4)', 
            [pid, uid, 'click', req.ip]);
            res.redirect(`${result.rows[0].base_url}${uid}`);
        } else {
            res.send("<h1>Survey is currently paused or unavailable.</h1>");
        }
    } catch (err) { res.status(500).send("System Error"); }
});

// 2. Status Redirects (As requested by you)
app.get('/redirect/:status', async (req, res) => {
    const { status } = req.params;
    const { pid, uid } = req.query;
    try {
        await pool.query('UPDATE responses SET status = $1 WHERE project_id = $2 AND uid = $3', [status, pid, uid]);
        res.sendFile(path.join(__dirname, 'views', `${status}.html`));
    } catch (err) { res.sendFile(path.join(__dirname, 'views', `${status}.html`)); }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));

app.listen(3000, () => console.log('Server Live on opinioninsights.in'));
