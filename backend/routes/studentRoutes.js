const r = require('express').Router();
const c = require('../controllers/studentController');
const { protect, admin, teacher } = require('../middleware/authMiddleware');

r.get('/me', protect, c.getMyStudentProfile);
r.put('/me', protect, c.updateMyProfile);
r.get('/', protect, teacher, c.getStudents);
r.post('/', protect, teacher, c.createStudent);
r.put('/:id', protect, teacher, c.updateStudent);
r.delete('/:id', protect, admin, c.deleteStudent);

module.exports = r;
