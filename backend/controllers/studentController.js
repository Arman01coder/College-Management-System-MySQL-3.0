const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const getStudents = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT s.*, CAST(s.id AS CHAR) AS id, CAST(s.user_id AS CHAR) AS user_id FROM students s ORDER BY s.id DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyStudentProfile = async (req, res) => {
  try {
    let [rows] = await pool.query(
      'SELECT s.*, CAST(s.id AS CHAR) AS id, CAST(s.user_id AS CHAR) AS user_id FROM students s WHERE s.user_id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rows.length) {
      [rows] = await pool.query(
        'SELECT s.*, CAST(s.id AS CHAR) AS id, CAST(s.user_id AS CHAR) AS user_id FROM students s WHERE LOWER(s.name) = LOWER(?) LIMIT 1',
        [req.user.name]
      );
    }
    if (!rows.length) {
      return res.status(404).json({ message: 'Student profile not linked to this account yet.' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const { phone, email } = req.body;
    await pool.query(
      'UPDATE students SET phone = ?, email = ?, contact = ? WHERE user_id = ?',
      [phone || '', email || '', email || phone || '', req.user.id]
    );
    const [rows] = await pool.query(
      'SELECT s.*, CAST(s.id AS CHAR) AS id, CAST(s.user_id AS CHAR) AS user_id FROM students s WHERE s.user_id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Student profile not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createStudent = async (req, res) => {
  try {
    const {
      name,
      rollNo,
      father_name,
      mother_name,
      department,
      year,
      semester,
      phone,
      email,
      contact,
      total_fee,
      paid_fee,
      username,
      password,
    } = req.body;

    if (!name || !rollNo) {
      return res.status(400).json({ message: 'Name and Roll No are required.' });
    }

    let userId = null;
    if (username && password) {
      const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Username already exists.' });
      }
      const hashed = await bcrypt.hash(password, 10);
      const [userRes] = await pool.query(
        'INSERT INTO users (name, username, password, role, department) VALUES (?, ?, ?, ?, ?)',
        [name, username, hashed, 'Student', department || 'BCA']
      );
      userId = userRes.insertId;
    }

    const totalFee = Number(total_fee) || 0;
    const paidFee = Number(paid_fee) || 0;
    const finalContact = contact || email || phone || '';

    const [result] = await pool.query(
      `INSERT INTO students
       (user_id, name, rollNo, father_name, mother_name, department, year, semester, phone, email, contact, total_fee, paid_fee)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        rollNo,
        father_name || '',
        mother_name || '',
        department || 'BCA',
        Number(year) || 1,
        semester || 'Sem 1',
        phone || '',
        email || '',
        finalContact,
        totalFee,
        paidFee,
      ]
    );

    const [created] = await pool.query(
      'SELECT s.*, CAST(s.id AS CHAR) AS id, CAST(s.user_id AS CHAR) AS user_id FROM students s WHERE s.id = ?',
      [result.insertId]
    );
    res.status(201).json(created[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const [existingRows] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!existingRows.length) return res.status(404).json({ message: 'Student not found' });
    const existing = existingRows[0];

    const {
      name,
      rollNo,
      father_name,
      mother_name,
      department,
      year,
      semester,
      phone,
      email,
      contact,
      total_fee,
      paid_fee,
    } = req.body;

    // Preserve existing fees if not provided in request
    const totalFee = total_fee !== undefined ? Number(total_fee) || 0 : Number(existing.total_fee) || 0;
    const paidFee = paid_fee !== undefined ? Number(paid_fee) || 0 : Number(existing.paid_fee) || 0;
    const finalPhone = phone !== undefined ? phone : existing.phone || '';
    const finalEmail = email !== undefined ? email : existing.email || '';
    const finalContact = contact || finalEmail || finalPhone || existing.contact || '';

    await pool.query(
      `UPDATE students
       SET name = ?, rollNo = ?, father_name = ?, mother_name = ?, department = ?, year = ?, semester = ?, phone = ?, email = ?, contact = ?, total_fee = ?, paid_fee = ?
       WHERE id = ?`,
      [
        name ?? existing.name,
        rollNo ?? existing.rollNo,
        father_name !== undefined ? father_name : existing.father_name || '',
        mother_name !== undefined ? mother_name : existing.mother_name || '',
        department ?? existing.department,
        year !== undefined ? Number(year) || 1 : existing.year,
        semester ?? existing.semester ?? 'Sem 1',
        finalPhone,
        finalEmail,
        finalContact,
        totalFee,
        paidFee,
        req.params.id,
      ]
    );

    const [updated] = await pool.query(
      'SELECT s.*, CAST(s.id AS CHAR) AS id, CAST(s.user_id AS CHAR) AS user_id FROM students s WHERE s.id = ?',
      [req.params.id]
    );
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT user_id FROM students WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Student not found' });

    const linkedUserId = rows[0].user_id;
    await pool.query('DELETE FROM students WHERE id = ?', [req.params.id]);
    if (linkedUserId) {
      await pool.query('DELETE FROM users WHERE id = ?', [linkedUserId]);
    }
    res.json({ message: 'Student and linked account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getStudents,
  getMyStudentProfile,
  updateMyProfile,
  createStudent,
  updateStudent,
  deleteStudent,
};
