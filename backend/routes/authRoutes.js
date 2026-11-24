const r = require('express'). Router();
const {
registerUser,
loginUser,
resetPassword,
changePassword,
changeUsername,
} = require('../controllers/authController'); 
const {protect } = require('../middleware/authMiddleware');
r.post('/register', registerUser);
r.post('/login', loginUser);
r.post('/reset-password', resetPassword);
r.put('/change-password', protect, changePassword);
r.put('/change-username', protect, changeUsername);
module.exports = r;