const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    religion: { type: String },
    identificationMarks: { type: String },
    medicalRecords: { type: String },
    studentPhoto: { type: String },
    currentClass: { type: String, required: true },
    section: { type: String, default: 'A' },
    rollNumber: { type: Number },
    academicYear: { type: String }, // e.g., "2025-2026"
    previousSchool: { type: String },
    previousResultSheet: { type: String },
    
    fatherName: { type: String },
    fatherPhone: { type: String },
    fatherEmail: { type: String },
    fatherOccupation: { type: String },
    fatherPhoto: { type: String },

    motherName: { type: String },
    motherPhone: { type: String },
    motherEmail: { type: String },
    motherOccupation: { type: String },
    motherPhoto: { type: String },

    guardianName: { type: String, required: true },
    guardianPhone: { type: String, required: true },
    guardianEmail: { type: String },
    guardianRelation: { type: String },
    guardianOccupation: { type: String },
    guardianPhoto: { type: String },
    emergencyContact: {
        name: String,
        phone: String,
        relation: String
    },
    address: { type: String },
    presentAddress: {
        district: String,
        division: String,
        thana: String,
        postOffice: String,
        details: String
    },
    permanentAddress: {
        district: String,
        division: String,
        thana: String,
        postOffice: String,
        details: String
    },
    documentsPdf: [{ type: String }],
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
