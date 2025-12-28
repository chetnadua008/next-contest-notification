const express = require('express');

const mysql = require('mysql');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');

const scrapeCodeForces = require('./platforms/codeforces.js'); // Imports the FUNCTION
const predictLeetCode = require('./platforms/leetcode.js');    // Imports the FUNCTION

const app = express();

// Create a connection to the database
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    // password: "your_password",
    database: "my_database"
});

//controller
async function getLatestContestInfo() {
    return new Promise((resolve, reject) => {
        // Sun Dec 28 2025 02:30:00 PM
        con.query('SELECT contest_name, platform, DATE_FORMAT(contest_date, "%a %b %d %Y %r") AS datetime, contest_time FROM contests ORDER BY contest_date ASC, contest_time ASC LIMIT 10', (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

//getdata route - server side render - html with contest data
app.get('/getdata', async (req, res) => {
    console.log('request came');
    try {
        const contests = await getLatestContestInfo();
        // console.log(contests);

        let datatable = `
        <table border="1">
            <tr>
                <th>Contest Name</th>
                <th>Platform</th>
                <th>Contest Date</th>
                <th>Length</th>
            </tr>`;

        contests.forEach(contest => {

            datatable += `
            <tr>
                <td>${contest.contest_name}</td>
                <td>${contest.platform}</td>
                <td>${contest.datetime}</td>
                <td>${contest.contest_time}</td>
            </tr>`;
        });

        datatable += '</table>';

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Next Contest</title>
            <link rel="stylesheet" type="text/css" href="Styles/style.css">
        </head>
        <body>
            ${datatable}
        </body>
        </html>
        `;
        res.status(200).send(htmlContent);
    } catch (error) {
        console.error('Error fetching data from database:', error);
        res.status(500).send('Internal Server Error');
    }
});

async function runLeetcodeScript() {
    try {
        const scriptPath = path.join(__dirname, 'platforms', 'leetcode.js');
        const scriptPath2 = path.join(__dirname, 'platforms', 'codeforces.js');
        // 1. Run CodeForces Scraper
        await scrapeCodeForces();

        // 2. Run LeetCode Predictor
        await predictLeetCode();
        console.log(`Executed script at ${new Date().toISOString()}`);
    } catch (err) {
        console.error('Error executing script:', err);
    }
}

//cron runs every 7 days
cron.schedule('0 0 0 */7 * *', () => {
    try {
        runLeetcodeScript();
    } catch (err) {
        console.log(err);
    }
})

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});