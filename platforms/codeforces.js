const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const mysql = require('mysql');
const moment = require('moment-timezone');

const app = express();
const port = 3000;
app.use(cors());


async function getLatestContestInfo() {
    try {
        //fetch html
        const response = await axios.get('https://codeforces.com/contests');
        //make dom tree
        const $ = cheerio.load(response.data);

        const contests = [];
        //scrape element with id datatable
        const firstDatatable = $('.datatable').first();

        //find row,  table tr with class=data-contestid (removes header)
        firstDatatable.find('table tr[data-contestid]').each((index, element) => {
            //tr(0)->column
            const contestName = $(element).find('td').eq(0).text().trim();
            const dateTime = $(element).find('td').eq(2).text().trim();
            const time = $(element).find('td').eq(3).text().trim();  //length

            const [datepart, timepart] = dateTime.split(' ');
            if (contestName && dateTime) {
                const [month, day, year] = datepart.split('/');
                const date2 = new Date(`${month} ${day}, ${year}`);

                const yyyy = date2.getFullYear();
                const mm = String(date2.getMonth() + 1).padStart(2, '0');
                const dd = String(date2.getDate()).padStart(2, '0');

                const formattedDate = `${yyyy}-${mm}-${dd}`;  //SQL format date
                const tempdate = formattedDate + " " + timepart + ':00+03:00';//UTC-3 russinan
                const finaldate = new Date(tempdate);


                const dateInIndia = moment(finaldate).utcOffset('+05:30');
                const date = dateInIndia.format();
                contests.push({ contestName, date, time });   //save name,date and length
                console.log(contestName, date, time);
            }

        });
        if (contests && contests.length > 0) {
            insertContestsToDB(contests);
        }
    } catch (error) {
        console.error('Error fetching contest info:', error);
        return null;
    }
}


async function insertContestsToDB(contests) {

    var con = mysql.createConnection({
        host: "localhost",
        user: "root",

        database: "my_database"
    });

    con.connect(err => {
        if (err) throw err;
        console.log("Connected to MySQL database!");


        //delete past contests from db
        con.query(`DELETE FROM contests WHERE contest_date < CURDATE()`, (err, result) => {
            if (err) {
                console.log("Error occurred while deleting contests");
                throw err;
            }
            console.log(`Number of contests deleted: ${result.affectedRows}`);
        });

        const sql = `INSERT ignore INTO contests (contest_name, platform, contest_date, contest_time) 
                     VALUES (?, 'Codeforces', ?, ?)`;

        contests.forEach(contest => {
            con.query(sql, [contest.contestName, contest.date, contest.time], (err, result) => {
                if (err) {
                    console.log("error");
                    throw err;
                }
                // console.log(contest.date);
                console.log(`Contest inserted/updated: ${contest.contestName}`);
            });
        });

        con.end();
    });
}

console.log('Codeforces started');
module.exports = getLatestContestInfo;
