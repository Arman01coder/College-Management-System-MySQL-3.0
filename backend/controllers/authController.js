const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const token = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

async function registerUser(req, res) {
  const { name, username, password, role } = req.body;
  if (!name || !username || !password || !role) {
    return res.status(400).json({ message: 'Please add all fields' });
  }
  if (!['Admin', 'Teacher', 'Student'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  const [old] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
  if (old.length) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const hash = await bcrypt.hash(password, 10);
    const [u] = await conn.query(
      'INSERT INTO users (name, username, password, role, department) VALUES (?, ?, ?, ?, ?)',
      [name, username, hash, role, 'Unassigned']
    );

    if (role === 'Student') {
      const [existingStudent] = await conn.query(
        'SELECT id, user_id FROM students WHERE LOWER(name) = LOWER(?) AND (rollNo = ? OR user_id IS NULL) LIMIT 1',
        [name.trim(), username.trim()]
      );
      if (existingStudent.length > 0) {
        if (existingStudent[0].user_id) {
          await conn.rollback();
          return res.status(409).json({
            message: 'An account for this student already exists. Please Sign In or use Forgot Password.',
          });
        }
        await conn.query('UPDATE students SET user_id = ? WHERE id = ?', [u.insertId, existingStudent[0].id]);
      } else {
        const [alreadyLinked] = await conn.query(
          'SELECT id FROM students WHERE rollNo = ? AND user_id IS NOT NULL LIMIT 1',
          [username.trim()]
        );
        if (alreadyLinked.length > 0) {
          await conn.rollback();
          return res.status(409).json({
            message: 'An account for this Roll No already exists. Please Sign In or use Forgot Password.',
          });
        }
        await conn.query(
          'INSERT INTO students (name, rollNo, department, year, contact, user_id) VALUES (?, ?, ?, ?, ?, ?)',
          [name, `NEW-${u.insertId}`, 'Unassigned', 1, `${username}@example.com`, u.insertId]
        );
      }
    }

    if (role === 'Teacher') {
      const [existingTeacher] = await conn.query(
        'SELECT id FROM teachers WHERE user_id IS NULL AND (LOWER(name) = LOWER(?) OR teacherId = ?) LIMIT 1',
        [name.trim(), username.trim()]
      );
      if (existingTeacher.length > 0) {
        await conn.query('UPDATE teachers SET user_id = ? WHERE id = ?', [u.insertId, existingTeacher[0].id]);
      } else {
        await conn.query(
          'INSERT INTO teachers (name, teacherId, department, contact, subjects, user_id) VALUES (?, ?, ?, ?, ?, ?)',
          [name, `T-${u.insertId}`, 'Unassigned', `${username}@example.com`, JSON.stringify([]), u.insertId]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ id: u.insertId, name, username, role, token: token(u.insertId) });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
}

async function loginUser(req, res) {
  const { username, password } = req.body;
  let [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  if (!rows.length) {
    [rows] = await pool.query(
      'SELECT u.* FROM users u JOIN students s ON s.user_id = u.id WHERE s.rollNo = ? LIMIT 1',
      [username]
    );
  }
  const u = rows[0];
  if (!u || !(await bcrypt.compare(password, u.password))) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }
  res.json({
    user: { id: String(u.id), name: u.name, role: u.role, department: u.department },
    token: token(u.id),
  });
}


async function resetPassword(req, res) {
  try {
    const { fullName, identifier, username, newPassword } = req.body;
    const lookup = (identifier || username || '').trim();
    const nameInput = (fullName || '').trim();

    if (!nameInput || !lookup || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: 'Full Name, Username/Roll No/Email/Mobile, and a new password (min 6 chars) are required.',
      });
    }

    // Match directly by Full Name + Username
    let [rows] = await pool.query(
      'SELECT id, username FROM users WHERE LOWER(name) = LOWER(?) AND LOWER(username) = LOWER(?) LIMIT 1',
      [nameInput, lookup]
    );

    // Fallback: if student forgot username, match by Full Name + Roll No / Email / Phone in students table
    if (!rows.length) {
      [rows] = await pool.query(
        `SELECT u.id, u.username
         FROM users u
         JOIN students s ON (s.user_id = u.id OR LOWER(s.name) = LOWER(u.name))
         WHERE LOWER(u.name) = LOWER(?)
           AND (LOWER(s.rollNo) = LOWER(?) OR LOWER(s.email) = LOWER(?) OR s.phone = ? OR LOWER(s.contact) = LOWER(?))
         LIMIT 1`,
        [nameInput, lookup, lookup, lookup, lookup]
      );
    }

    if (!rows.length) {
      return res.status(404).json({
        message: 'Verification failed. Full Name and Username / Roll No / Contact did not match.',
      });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, rows[0].id]);
    res.json({
      message: `Password reset! Your username is "${rows[0].username}". Please sign in.`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}


async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Current password and a new password (min 6 characters) are required.' });
    }
    const [rows] = await pool.query('SELECT id, password FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}


async function changeUsername(req, res) {
  try {
    const newUsername = (req.body.newUsername || '').trim();
    if (!newUsername || newUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters long.' });
    }
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?',
      [newUsername, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'That username is already taken.' });
    }
    await pool.query('UPDATE users SET username = ? WHERE id = ?', [newUsername, req.user.id]);
    res.json({ message: 'Username updated successfully.', username: newUsername });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { registerUser, loginUser, resetPassword, changePassword, changeUsername };