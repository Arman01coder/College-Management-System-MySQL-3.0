const mongoose = require('mongoose');

const attendanceSchema = mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  date: {
    type: String, // Storing as YYYY-MM-DD string for simplicity
    required: true,
  },
  present: {
    type: Boolean,
    required: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure a student can only have one attendance record per course per day
attendanceSchema.index({ student: 1, course: 1, date: 1 }, { unique: true });

attendanceSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
