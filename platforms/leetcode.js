const express = require('express');
const mysql = require('mysql');
const { platform } = require('os');
const fs = require('fs').promises;
const path = require('path');

async function readJSON(filePath) {
}

async function writeJSON(filePath, data) {
}

function getDateDifference(date1, date2) {
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function addDaysToDate(dateString, days) {
}

async function processData() {
  const filePath = path.join(__dirname, 'data.json');
  const data = await readJSON(filePath);
  if (!data) return;

  const today = new Date();
  // console.log('today: ', today);
  let updated = false;

  const weeklyLastUpdate = new Date(data.weekly_last_update);

  const contests = [];

  if (getDateDifference(weeklyLastUpdate, today) >= 7) {

    contests.push({
      contest_name: `Weekly Contest ${data.leetcode_weekly}`,
      platform: 'Leetcode',
      contest_date: `${data.weekly_next_contest} 08:00:00`,
      contest_time: '01:30'
    });

    data.leetcode_weekly += 1;
    data.weekly_next_contest = addDaysToDate(data.weekly_next_contest, 7);
    data.weekly_last_update = today.toISOString().split('T')[0];
    updated = true;
  }

  const biweeklyLastUpdate = new Date(data.biweekly_last_update);
  if (getDateDifference(biweeklyLastUpdate, today) >= 14) {

    contests.push({
      contest_name: `Biweekly Contest ${data.leetcode_biweekly}`,
      platform: 'Leetcode',
      contest_date: `${data.biweekly_next_contest} 20:00:00`,
      contest_time: '01:30'
    });

    data.leetcode_biweekly += 1;
    data.biweekly_next_contest = addDaysToDate(data.biweekly_next_contest, 14);
    data.biweekly_last_update = today.toISOString().split('T')[0];
    updated = true;

  }

  const gfgLastUpdate = new Date(data.gfg_last_update);
  if (getDateDifference(gfgLastUpdate, today) >= 7) {

    contests.push({
      contest_name: `GFG Weekly Contest ${data.gfg_weekly}`,
      platform: 'GeeksForGeeks',
      contest_date: `${data.gfg_next_contest} 19:00:00`,
      contest_time: '01:30'
    });

    data.gfg_weekly += 1;
    data.gfg_next_contest = addDaysToDate(data.gfg_next_contest, 7);
    data.gfg_last_update = today.toISOString().split('T')[0];
    updated = true;

  }

  const codechefLastUpdate = new Date(data.codechef_last_update);
  if (getDateDifference(codechefLastUpdate, today) >= 7) {
    contests.push({
      contest_name: `CodeChef Starter ${data.codechef_starter}`,
      platform: 'CodeChef',
      contest_date: `${data.codechef_next_contest} 20:00:00`,
      contest_time: '02:00'
    });

    data.codechef_starter += 1;
    data.codechef_next_contest = addDaysToDate(data.codechef_next_contest, 7);
    data.codechef_last_update = today.toISOString().split('T')[0];
    updated = true;
  }


  if ( updated ){
    await insertContestsToDB(contests);
    await writeJSON(filePath, data);
  }
}

async function insertContestsToDB(contests) {
  const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
   
    database: 'my_database'
  });

  con.connect(err => {
    if (err) throw err;
    console.log("Connected to MySQL database!");

    const sql = `INSERT ignore INTO contests (contest_name, platform, contest_date, contest_time) 
                 VALUES (?, ?, ?, ?)`;

    contests.forEach(contest => {
      con.query(sql, [contest.contest_name, contest.platform, contest.contest_date, contest.contest_time], (err, result) => {
        if (err) {
          console.error('Error inserting contest:', err);
          throw err;
        }
        console.log(`Contest inserted/updated: ${contest.contest_name}, ${contest.platform}, ${contest.contest_date}, ${contest.contest_time}`);
      });
    });
    con.end();
  });
}

// Execute the main function
console.log('Oh yes');
processData();