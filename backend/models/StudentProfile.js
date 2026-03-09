const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    currentClass: { type: String, required: true },
    section: { type: String, default: 'A' },
    rollNumber: { type: Number },
    guardianName: { type: String, required: true },
    guardianPhone: { type: String, required: true },
    guardianEmail: { type: String },
    emergencyContact: {
        name: String,
        phone: String,
        relation: String
    },
    address: { type: String },
    academicHistory: [{
        year: String,
        class: String,
        grade: String,
        remarks: String
    }],
    status: { type: String, enum: ['active', 'graduated', 'transferred'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
module.exports = StudentProfile;
