const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'college_management',
  waitForConnections: true,
  connectionLimit: 10,
  ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost'
    ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    : undefined,
});

async function initializeDatabase() {
  const c = await pool.getConnection();
  try {
    await c.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      username VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('Admin','Teacher','Student') NOT NULL DEFAULT 'Student',
      department VARCHAR(120) DEFAULT 'General',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await c.query(`CREATE TABLE IF NOT EXISTS students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      name VARCHAR(150) NOT NULL,
      rollNo VARCHAR(80) NOT NULL UNIQUE,
      department VARCHAR(120) DEFAULT 'Computer Science',
      year INT DEFAULT 1,
      semester VARCHAR(40) DEFAULT 'Sem 1',
      contact VARCHAR(150) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    try {
      await c.query(`ALTER TABLE students ADD COLUMN semester VARCHAR(40) DEFAULT 'Sem 1'`);
    } catch (_) {}

    await c.query(`CREATE TABLE IF NOT EXISTS teachers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      name VARCHAR(150) NOT NULL,
      teacherId VARCHAR(80) NOT NULL UNIQUE,
      department VARCHAR(120) DEFAULT 'Computer Science',
      subjects JSON NULL,
      contact VARCHAR(150) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await c.query(`CREATE TABLE IF NOT EXISTS courses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      courseId VARCHAR(80) NOT NULL UNIQUE,
      name VARCHAR(150) NOT NULL,
      department VARCHAR(120) DEFAULT 'Computer Science',
      credits INT DEFAULT 4,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await c.query(`CREATE TABLE IF NOT EXISTS attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      course_id INT NOT NULL,
      date DATE NOT NULL,
      status ENUM('Present','Absent','Late') NOT NULL DEFAULT 'Present'
    )`);

    try { await c.query(`ALTER TABLE students ADD COLUMN total_fee DECIMAL(10,2) DEFAULT 0`); } catch (_) {}
    try { await c.query(`ALTER TABLE students ADD COLUMN paid_fee DECIMAL(10,2) DEFAULT 0`); } catch (_) {}
    try { await c.query(`ALTER TABLE attendance ADD COLUMN present BOOLEAN NOT NULL DEFAULT TRUE`); } catch (_) {}
    try { await c.query(`ALTER TABLE attendance ADD UNIQUE KEY uniq_attendance (student_id, course_id, date)`); } catch (_) {}
    try { await c.query(`ALTER TABLE students MODIFY COLUMN user_id INT NULL`); } catch (_) {}
    try { await c.query(`ALTER TABLE students ADD COLUMN father_name VARCHAR(150) DEFAULT ''`); } catch (_) {}
    try { await c.query(`ALTER TABLE students ADD COLUMN mother_name VARCHAR(150) DEFAULT ''`); } catch (_) {}
    try { await c.query(`ALTER TABLE students ADD COLUMN phone VARCHAR(30) DEFAULT ''`); } catch (_) {}
    try { await c.query(`ALTER TABLE students ADD COLUMN email VARCHAR(150) DEFAULT ''`); } catch (_) {}

    console.log('MySQL connected; tables, semester & fee columns are ready.');
  } finally {
    c.release();
  }
}

module.exports = { pool, initializeDatabase };
