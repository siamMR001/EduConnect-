const mongoose = require('mongoose');

const courseMaterialSchema = new mongoose.Schema({
    classroomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true
    },
    courseId: {
        type: String, // String representation of the subdoc ID in Classroom.courses
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    type: {
        type: String,
        enum: ['pdf', 'link', 'image', 'video', 'homework'],
        required: true
    },
    url: {
        type: String,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const CourseMaterial = mongoose.model('CourseMaterial', courseMaterialSchema);
module.exports = CourseMaterial;
