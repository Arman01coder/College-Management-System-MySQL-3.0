const mongoose = require('mongoose');

const studentSchema = mongoose.Schema({
  name: { type: String, required: true },
  rollNo: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  year: { type: Number, required: true },
  contact: { type: String, required: true },
  // Link to the user model
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

studentSchema.virtual('id').get(function(){
    return this._id.toHexString();
});


const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
