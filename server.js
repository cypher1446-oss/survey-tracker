const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(express.static('public'));

// 1. Start Redirect Route
app.get('/start', async (req, res) => {
    const { vcode, uid } = req.query; 
    try {
        const result = await pool.query('SELECT base_url, status, project_code FROM projects WHERE project_code = $1', [vcode]);
        if (result.rows.length > 0 && result.rows[0].status === 'active') {
            await pool.query('INSERT INTO responses (project_id, uid, status, ip) VALUES ($1, $2, $3, $4)', 
            [result.rows[0].project_code, uid, 'click', req.ip]);
            
            let finalUrl = result.rows[0].base_url + uid;
            res.redirect(finalUrl);
        } else {
            res.send("<h1>Survey is currently paused or unavailable.</h1>");
        }
    } catch (err) { res.status(500).send("Error"); }
});

// 2. Status Redirects (Complete, Terminate, Quota, Security)
app.get('/redirect/:status', (req, res) => {
    const { status } = req.params;
    const { pid, uid } = req.query;
    // Log status in background and show page
    pool.query('UPDATE responses SET status = $1 WHERE project_id = $2 AND uid = $3', [status, pid, uid]);
    res.sendFile(path.join(__dirname, 'views', `${status}.html`));
});

// 3. Admin Route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
