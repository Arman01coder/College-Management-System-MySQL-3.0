const r = require('express').Router();
const c = require('../controllers/teacherController');
const { protect, admin } = require('../middleware/authMiddleware');

r.get('/', protect, admin, c.getTeachers);
r.post('/', protect, admin, c.createTeacher);
r.put('/:id', protect, admin, c.updateTeacher);
r.delete('/:id', protect, admin, c.deleteTeacher);

module.exports = r;
