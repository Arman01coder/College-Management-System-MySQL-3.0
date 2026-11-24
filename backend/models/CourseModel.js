const mongoose = require('mongoose');

const courseSchema = mongoose.Schema({
  courseId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  credits: { type: Number, required: true },
  department: { type: String, required: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

courseSchema.virtual('id').get(function(){
    return this._id.toHexString();
});


const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
