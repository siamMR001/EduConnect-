const CourseMaterial = require('../models/CourseMaterial');
const SubjectGradeConfig = require('../models/SubjectGradeConfig');
const SubjectGrade = require('../models/SubjectGrade');
const Classroom = require('../models/Classroom');

// --- Materials ---
exports.getMaterials = async (req, res) => {
    try {
        const { classroomId, courseId } = req.query;
        const materials = await CourseMaterial.find({ classroomId, courseId })
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(materials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addMaterial = async (req, res) => {
    try {
        console.log('Adding material. Body:', req.body);
        if (req.file) console.log('File detected:', req.file);

        let { title, type, url, description, classroomId, courseId } = req.body;
        
        // If file uploaded, use file path as URL
        if (req.file) {
            url = `/uploads/materials/${req.file.filename}`;
        }

        const material = new CourseMaterial({
            title,
            type,
            url,
            description,
            classroomId,
            courseId,
            uploadedBy: req.user._id
        });

        await material.save();
        res.status(201).json(material);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteMaterial = async (req, res) => {
    try {
        await CourseMaterial.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Material deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Grading Config ---
exports.getGradeConfig = async (req, res) => {
    try {
        const { classroomId, courseId } = req.query;
        let config = await SubjectGradeConfig.findOne({ classroomId, courseId });
        if (!config) {
            // Return default config if none exists
            config = { categories: [], classroomId, courseId };
        }
        res.status(200).json(config);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateGradeConfig = async (req, res) => {
    try {
        const { classroomId, courseId, categories } = req.body;
        const config = await SubjectGradeConfig.findOneAndUpdate(
            { classroomId, courseId },
            { categories, updatedBy: req.user._id, updatedAt: Date.now() },
            { upsert: true, new: true }
        );
        res.status(200).json(config);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// --- Student Grades ---
exports.getSubjectGrades = async (req, res) => {
    try {
        const { classroomId, courseId } = req.query;
        
        // 1. Get Classroom to list students
        const classroom = await Classroom.findById(classroomId).populate('studentIds', 'name');
        if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

        // 2. Get existing grades
        const grades = await SubjectGrade.find({ classroomId, courseId });
        
        // 3. Merge: ensure every student in classroom has a grade record (at least in response)
        const studentGrades = classroom.studentIds.map(student => {
            const grade = grades.find(g => g.studentId.toString() === student._id.toString());
            return {
                studentId: student._id,
                name: student.name,
                scores: grade ? grade.scores : {},
                totalWeightedScore: grade ? grade.totalWeightedScore : 0
            };
        });

        res.status(200).json(studentGrades);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSubjectGrades = async (req, res) => {
    try {
        const { classroomId, courseId, grades } = req.body; // grades: [{ studentId, scores }]
        
        const operations = grades.map(g => {
            // Calculate total weighted score if config is available would be nice, 
            // but for simplicity we can just save. 
            // Better to calculate on save or retrieval.
            return {
                updateOne: {
                    filter: { classroomId, courseId, studentId: g.studentId },
                    update: { 
                        scores: g.scores, 
                        updatedBy: req.user._id, 
                        updatedAt: Date.now() 
                    },
                    upsert: true
                }
            };
        });

        await SubjectGrade.bulkWrite(operations);
        res.status(200).json({ message: 'Grades updated successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
