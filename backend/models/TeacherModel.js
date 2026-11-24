const mongoose = require('mongoose');

const teacherSchema = mongoose.Schema({
  name: { type: String, required: true },
  teacherId: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  contact: { type: String, required: true },
  subjects: [{ type: String }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

teacherSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;
