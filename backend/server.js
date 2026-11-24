require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

let dbReadyPromise = null;
app.use(async (req, res, next) => {
  try {
    if (!dbReadyPromise) {
      dbReadyPromise = initializeDatabase();
    }
    await dbReadyPromise;
    next();
  } catch (e) {
    dbReadyPromise = null;
    next(e);
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', database: 'MySQL' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  initializeDatabase()
    .then(() => app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`)))
    .catch((e) => {
      console.error('Database startup failed:', e.message);
      process.exit(1);
    });
}

module.exports = app;