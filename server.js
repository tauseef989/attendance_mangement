const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = 3000;

// Enable CORS middleware
app.use(cors());

// Create connection to MySQL database
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'aA@11111',
  database: 'attendance_db'
});

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }))

// Endpoint to store attendance data
app.post('/attendance', async (req, res) => {
  const { date, attendanceData } = req.body;

  try {
    // Insert attendance data into database
    const connection = await pool.getConnection();
    const query = 'INSERT INTO attendance (date, student, status) VALUES ?';
    const values = Object.entries(attendanceData).map(([student, status]) => [date, student, status]);
    await connection.query(query, [values]);
    connection.release();
    console.log('Attendance stored successfully');
    res.status(200).send('Attendance stored successfully');
  } catch (err) {
    console.error('Error storing attendance:', err);
    res.status(500).send('Failed to store attendance');
  }
});

// Endpoint to fetch attendance data for a specific date
app.get('/attendance/:date', async (req, res) => {
  const date = req.params.date;
  console.log("getdate1")

  try {
    // Fetch attendance data from database for the given date
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM attendance WHERE date = ?', [date]);
    connection.release();
    console.log("getdate",rows)
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching attendance data:', err);
    res.status(500).send('Failed to fetch attendance data');
  }
});

// Endpoint to fetch attendance report
app.get('/attendance/report/a', async (req, res) => {
  console.log("a")
  try {
    console.log("aa")
    // Fetch attendance report from the database
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(`
      SELECT 
        student, 
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present, 
        COUNT(*) AS total 
      FROM 
        attendance 
      GROUP BY 
        student
    `);
    connection.release();
    console.log("aaa",rows)
    // Calculate percentage of attendance
    const reportData = rows.map(row => ({
      student: row.student,
      present: row.present,
      total: row.total,
      percentage: row.total ? ((row.present / row.total) * 100).toFixed(2) : 0
    }));

    res.status(200).json(reportData);
  } catch (err) {
    console.error('Error fetching attendance report:', err);
    res.status(500).send('Failed to fetch attendance report');
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});