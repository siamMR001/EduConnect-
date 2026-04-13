const mongoose = require('mongoose');

const gradeSectionSchema = new mongoose.Schema({
    // Grade/Class (e.g., "1", "2", ..., "10")
    grade: { type: String, required: true },
    
    // Maximum number of sections for this grade (e.g., A, B, C, D)
    maxSections: { type: Number, required: true, default: 4 },
    
    // Array of sections with their max capacity
    sections: [{
        sectionName: { type: String, required: true }, // A, B, C, D, etc.
        maxStudents: { type: Number, required: true, default: 50 },
        currentStudentCount: { type: Number, default: 0 },
        rollNumberStart: { type: Number }, // Starting roll number for this section
        rollNumberEnd: { type: Number },   // Ending roll number for this section
        isFull: { type: Boolean, default: false }
    }],
    
    // Total capacity for grade
    totalCapacity: { type: Number },
    
    // Current enrollment in grade
    currentEnrollment: { type: Number, default: 0 },
    
    // Academic year this configuration applies to
    academicYear: { type: String, required: true }, // e.g., "2025-2026"
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Index for quick lookup
gradeSectionSchema.index({ grade: 1, academicYear: 1 });

const GradeSection = mongoose.model('GradeSection', gradeSectionSchema);
module.exports = GradeSection;
