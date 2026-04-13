const mongoose = require('mongoose');

const employeeIDSchema = new mongoose.Schema({
    // Unique ID for teacher/employee (e.g., TCH-2026-001)
    employeeId: { type: String, required: true, unique: true },
    
    // Type of employee (teacher, admin, staff, etc.)
    employeeType: {
        type: String,
        enum: ['teacher', 'admin', 'staff', 'principal', 'vice_principal'],
        required: true
    },
    
    // Personal information
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    dateOfBirth: { type: Date },
    
    // Status of registration
    status: {
        type: String,
        enum: ['pending', 'active', 'inactive'],
        default: 'pending'
    },
    
    // Link to user account (when they register)
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Verification code (used for one-time registration)
    registrationCode: { type: String },
    codeExpiry: { type: Date },
    
    // Department/Subject (for teachers)
    department: { type: String },
    subject: { type: String },
    
    // Address
    address: { type: String },
    city: { type: String },
    state: { type: String },
    
    // Generated date and who generated it
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    generatedAt: { type: Date, default: Date.now },
    
    // Registration date (when employee creates account)
    registeredAt: { type: Date }
});

const EmployeeID = mongoose.model('EmployeeID', employeeIDSchema);
module.exports = EmployeeID;
