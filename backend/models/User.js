const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'teacher', 'student', 'employee'],
        required: true,
        default: 'student'
    },
    // Link to EmployeeID (for teachers)
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeID' },
    
    studentProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile' },
    
    createdAt: { type: Date, default: Date.now }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual population for student profile
userSchema.virtual('profile', {
    ref: 'StudentProfile',
    localField: '_id',
    foreignField: 'user',
    justOne: true
});

// Password Hash middleware
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
