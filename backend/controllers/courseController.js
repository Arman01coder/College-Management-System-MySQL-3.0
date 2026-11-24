const { pool } = require('../config/db');

const getCourses = async (req, res) => {
  try {
    const [r] = await pool.query('SELECT *, CAST(id AS CHAR) AS id FROM courses ORDER BY id DESC');
    res.json(r);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createCourse = async (req, res) => {
  try {
    const { courseId, name, credits, department } = req.body;
    if (!courseId || !name || credits == null || !department) {
      return res.status(400).json({ message: 'All course fields are required' });
    }
    const [r] = await pool.query(
      'INSERT INTO courses (courseId, name, credits, department) VALUES (?, ?, ?, ?)',
      [courseId, name, Number(credits) || 4, department]
    );
    res.status(201).json({ id: String(r.insertId), courseId, name, credits: Number(credits) || 4, department });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { courseId, name, credits, department } = req.body;
    await pool.query(
      'UPDATE courses SET courseId = ?, name = ?, credits = ?, department = ? WHERE id = ?',
      [courseId, name, Number(credits) || 4, department, req.params.id]
    );
    const [updated] = await pool.query('SELECT *, CAST(id AS CHAR) AS id FROM courses WHERE id = ?', [req.params.id]);
    if (!updated.length) return res.status(404).json({ message: 'Course not found' });
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const [r] = await pool.query('DELETE FROM courses WHERE id = ?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getCourses, createCourse, updateCourse, deleteCourse };
