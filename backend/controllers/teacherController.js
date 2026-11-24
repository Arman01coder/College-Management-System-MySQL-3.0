const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const parseSubjects = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : val.split(',').map((s) => s.trim()).filter(Boolean);
    } catch {
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

const getTeachers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT t.*, CAST(t.id AS CHAR) AS id, CAST(t.user_id AS CHAR) AS user_id FROM teachers t ORDER BY t.id DESC'
    );
    res.json(rows.map((t) => ({ ...t, subjects: parseSubjects(t.subjects) })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createTeacher = async (req, res) => {
  try {
    const { name, teacherId, department, subjects, contact, username, password } = req.body;
    if (!name || !teacherId) {
      return res.status(400).json({ message: 'Name and Teacher ID are required.' });
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
        [name, username, hashed, 'Teacher', department || 'Computer Science']
      );
      userId = userRes.insertId;
    }

    const subjList = parseSubjects(subjects);
    const [result] = await pool.query(
      'INSERT INTO teachers (user_id, name, teacherId, department, subjects, contact) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, teacherId, department || 'Computer Science', JSON.stringify(subjList), contact || '']
    );

    const [created] = await pool.query(
      'SELECT t.*, CAST(t.id AS CHAR) AS id, CAST(t.user_id AS CHAR) AS user_id FROM teachers t WHERE t.id = ?',
      [result.insertId]
    );
    res.status(201).json({ ...created[0], subjects: parseSubjects(created[0].subjects) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateTeacher = async (req, res) => {
  try {
    const { name, teacherId, department, subjects, contact } = req.body;
    const subjList = parseSubjects(subjects);
    await pool.query(
      'UPDATE teachers SET name = ?, teacherId = ?, department = ?, subjects = ?, contact = ? WHERE id = ?',
      [name, teacherId, department, JSON.stringify(subjList), contact || '', req.params.id]
    );
    const [updated] = await pool.query(
      'SELECT t.*, CAST(t.id AS CHAR) AS id, CAST(t.user_id AS CHAR) AS user_id FROM teachers t WHERE t.id = ?',
      [req.params.id]
    );
    if (!updated.length) return res.status(404).json({ message: 'Teacher not found' });
    res.json({ ...updated[0], subjects: parseSubjects(updated[0].subjects) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteTeacher = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT user_id FROM teachers WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Teacher not found' });

    const linkedUserId = rows[0].user_id;
    await pool.query('DELETE FROM teachers WHERE id = ?', [req.params.id]);
    if (linkedUserId) {
      await pool.query('DELETE FROM users WHERE id = ?', [linkedUserId]);
    }
    res.json({ message: 'Teacher and linked account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTeachers, createTeacher, updateTeacher, deleteTeacher };