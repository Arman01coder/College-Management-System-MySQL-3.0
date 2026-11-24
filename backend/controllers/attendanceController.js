const { pool } = require('../config/db');

const getAttendance = async (req, res) => {
  try {
    const [r] = await pool.query(`
      SELECT 
        CAST(a.id AS CHAR) AS id,
        CAST(a.student_id AS CHAR) AS studentId,
        CAST(a.course_id AS CHAR) AS courseId,
        DATE_FORMAT(a.date, '%Y-%m-%d') AS date,
        CAST(a.present AS UNSIGNED) AS present,
        s.name AS studentName,
        s.rollNo,
        s.department,
        c.name AS courseName,
        c.courseId AS courseCode
      FROM attendance a
      JOIN students s ON s.id = a.student_id
      JOIN courses c ON c.id = a.course_id
      ORDER BY a.date DESC, a.id DESC
    `);
    res.json(r.map(row => ({ ...row, present: Boolean(row.present) })));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getStudentAttendance = async (req, res) => {
  try {
    const userId = req.params.userId;
    let [s] = await pool.query('SELECT id, name, rollNo, department FROM students WHERE user_id = ?', [userId]);

    // Agar user_id link nahi hai toh user ke naam se match karke link karein
    if (!s.length) {
      const [u] = await pool.query('SELECT name FROM users WHERE id = ?', [userId]);
      if (u.length) {
        const [byName] = await pool.query(
          'SELECT id, name, rollNo, department FROM students WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1',
          [u[0].name]
        );
        if (byName.length) {
          await pool.query('UPDATE students SET user_id = ? WHERE id = ?', [userId, byName[0].id]);
          s = byName;
        }
      }
    }

    if (!s.length) {
      return res.json([]);
    }

    const [r] = await pool.query(`
      SELECT 
        CAST(a.id AS CHAR) AS id,
        CAST(a.student_id AS CHAR) AS studentId,
        CAST(a.course_id AS CHAR) AS courseId,
        DATE_FORMAT(a.date, '%Y-%m-%d') AS date,
        CAST(a.present AS UNSIGNED) AS present,
        c.name AS courseName,
        c.courseId AS courseCode
      FROM attendance a
      LEFT JOIN courses c ON c.id = a.course_id
      WHERE a.student_id = ?
      ORDER BY a.date DESC, a.id DESC
    `, [s[0].id]);

    res.json(r.map(row => ({ ...row, present: Boolean(row.present) })));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const saveAttendance = async (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records) || !records.length) {
    return res.status(400).json({ message: 'Please mark at least one student' });
  }
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    for (const x of records) {
      if (!x.studentId || !x.courseId || !x.date || typeof x.present !== 'boolean') {
        throw new Error('Invalid attendance record');
      }
      const [existing] = await c.query(
        'SELECT id FROM attendance WHERE student_id = ? AND course_id = ? AND DATE(date) = ?',
        [x.studentId, x.courseId, x.date]
      );
      if (existing.length) {
        await c.query('UPDATE attendance SET present = ? WHERE id = ?', [x.present ? 1 : 0, existing[0].id]);
      } else {
        await c.query(
          'INSERT INTO attendance (student_id, course_id, date, present) VALUES (?, ?, ?, ?)',
          [x.studentId, x.courseId, x.date, x.present ? 1 : 0]
        );
      }
    }
    await c.commit();
    res.status(201).json({ message: 'Attendance saved successfully' });
  } catch (e) {
    await c.rollback();
    res.status(400).json({ message: e.message });
  } finally {
    c.release();
  }
};

module.exports = { getAttendance, getStudentAttendance, saveAttendance };