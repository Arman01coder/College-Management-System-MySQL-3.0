const r = require('express').Router();
const c = require('../controllers/courseController');
const { protect, admin, teacher } = require('../middleware/authMiddleware');

r.get('/', protect, teacher, c.getCourses);
r.post('/', protect, teacher, c.createCourse);
r.put('/:id', protect, teacher, c.updateCourse);
r.delete('/:id', protect, admin, c.deleteCourse);

module.exports = r;
