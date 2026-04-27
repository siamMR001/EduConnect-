const mongoose = require('mongoose');
const GradeSection = require('../models/GradeSection');
const StudentProfile = require('../models/StudentProfile');
const Classroom = require('../models/Classroom');

// Create or update grade and section configuration (Admin only)
exports.createGradeConfiguration = async (req, res) => {
    try {
        const { grade, maxSections, academicYear, sections } = req.body;

        if (!grade || !maxSections || !academicYear) {
            return res.status(400).json({ message: 'Grade, maxSections, and academicYear are required' });
        }

        // Check if configuration already exists
        let gradeConfig = await GradeSection.findOne({ grade, academicYear });

        if (gradeConfig) {
            return res.status(400).json({ message: 'Configuration for this grade already exists for the selected academic year. You cannot create duplicates.' });
        }

        // Create sections array if not provided
        const defaultSections = [];
        for (let i = 0; i < maxSections; i++) {
            const sectionName = String.fromCharCode(65 + i); // A, B, C, D...
            defaultSections.push({
                sectionName,
                maxStudents: 50,
                currentStudentCount: 0,
                isFull: false
            });
        }

        const newGradeConfig = await GradeSection.create({
            grade,
            maxSections,
            sections: sections || defaultSections,
            academicYear,
            totalCapacity: (sections || defaultSections).reduce((sum, s) => sum + s.maxStudents, 0)
        });

        res.status(201).json({
            message: 'Grade configuration created successfully',
            gradeConfig: newGradeConfig
        });
    } catch (error) {
        console.error('Error creating grade configuration:', error);
        res.status(500).json({ message: 'Error creating grade configuration', error: error.message });
    }
};

// Get all grade configurations
exports.getAllGradeConfigurations = async (req, res) => {
    try {
        const { academicYear } = req.query;
        
        let filter = {};
        if (academicYear) filter.academicYear = academicYear;

        const gradeConfigs = await GradeSection.find(filter);
        
        // Sort numerically (Class 1, 2... 10, 11...)
        gradeConfigs.sort((a, b) => {
            const numA = parseInt(a.grade);
            const numB = parseInt(b.grade);
            return numA - numB;
        });

        res.status(200).json({
            total: gradeConfigs.length,
            gradeConfigs
        });
    } catch (error) {
        console.error('Error fetching grade configurations:', error);
        res.status(500).json({ message: 'Error fetching grade configurations', error: error.message });
    }
};

// Get specific grade configuration
exports.getGradeConfiguration = async (req, res) => {
    try {
        const { grade, academicYear } = req.query;

        if (!grade || !academicYear) {
            return res.status(400).json({ message: 'Grade and academicYear are required' });
        }

        const gradeConfig = await GradeSection.findOne({ grade, academicYear });

        if (!gradeConfig) {
            return res.status(404).json({ message: 'Grade configuration not found' });
        }

        res.status(200).json(gradeConfig);
    } catch (error) {
        console.error('Error fetching grade configuration:', error);
        res.status(500).json({ message: 'Error fetching grade configuration', error: error.message });
    }
};

// Update section Max capacity and Name (Admin only)
exports.updateSection = async (req, res) => {
    try {
        const { grade, academicYear, sectionName, newSectionName, maxStudents } = req.body;

        if (!grade || !academicYear || !sectionName || !maxStudents || !newSectionName) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const gradeConfig = await GradeSection.findOne({ grade, academicYear });

        if (!gradeConfig) {
            return res.status(404).json({ message: 'Grade configuration not found' });
        }

        const sectionIndex = gradeConfig.sections.findIndex(s => s.sectionName === sectionName);

        if (sectionIndex === -1) {
            return res.status(404).json({ message: 'Section not found' });
        }

        if (newSectionName !== sectionName) {
            const numericGradeStr = isNaN(parseInt(grade)) ? grade : parseInt(grade).toString();
            const Classroom = mongoose.model('Classroom');
            const StudentProfile = mongoose.model('StudentProfile');
            
            await Classroom.updateMany(
                { classNumber: numericGradeStr, section: sectionName, academicYear },
                { section: newSectionName, name: `Class ${numericGradeStr} - ${newSectionName}` }
            );

            await StudentProfile.updateMany(
                { currentClass: numericGradeStr, section: sectionName, academicYear },
                { section: newSectionName }
            );
        }

        gradeConfig.sections[sectionIndex].sectionName = newSectionName;
        gradeConfig.sections[sectionIndex].maxStudents = maxStudents;
        gradeConfig.totalCapacity = gradeConfig.sections.reduce((sum, s) => sum + s.maxStudents, 0);
        gradeConfig.updatedAt = new Date();

        await gradeConfig.save();

        res.status(200).json({
            message: 'Section updated successfully',
            gradeConfig
        });
    } catch (error) {
        console.error('Error updating section:', error);
        res.status(500).json({ message: 'Error updating section', error: error.message });
    }
};

// Helper to assign a student to the next available section
exports.performStudentAssignment = async (studentId, grade, academicYear) => {
    const Classroom = mongoose.model('Classroom');
    const StudentProfile = mongoose.model('StudentProfile');
    
    // Find all classrooms for this grade and year
    // Handle both '7' and 7
    const classNumberStr = isNaN(parseInt(grade)) ? grade : parseInt(grade).toString();
    const classrooms = await Classroom.find({ 
        classNumber: classNumberStr, 
        academicYear 
    });

    if (!classrooms || classrooms.length === 0) {
        throw new Error('No sections deployed for this grade');
    }

    // Find the first available section (not at capacity)
    const availableSection = classrooms.find(c => c.studentIds.length < (c.capacity || 30));

    if (!availableSection) {
        throw new Error('No available seats in any section for this grade');
    }

    // 1. Update student profile
    const student = await StudentProfile.findById(studentId);
    if (!student) {
        throw new Error('Student profile not found');
    }

    // Clean up current studentIds to ensure roll is correct
    availableSection.studentIds = availableSection.studentIds.filter(id => id != null);
    
    // If student already in this section, just return
    const userRef = student.user || studentId;
    if (availableSection.studentIds.map(id => id.toString()).includes(userRef.toString())) {
        return {
            studentId: student.studentId,
            name: `${student.firstName} ${student.lastName}`,
            section: student.section,
            rollNumber: student.rollNumber,
            grade: student.currentClass
        };
    }

    const rollNumber = (availableSection.studentIds.length + 1).toString();

    student.section = availableSection.section;
    student.rollNumber = rollNumber;
    student.academicYear = academicYear;
    student.currentClass = classNumberStr;
    await student.save();

    // 2. Add student to Classroom member list
    availableSection.studentIds.push(userRef);
    await availableSection.save();

    return {
        studentId: student.studentId,
        name: `${student.firstName} ${student.lastName}`,
        section: student.section,
        rollNumber: student.rollNumber,
        grade: student.currentClass
    };
};

// Assign student to next available section (used during student enrollment)
exports.assignStudentToSection = async (req, res) => {
    try {
        const { grade, academicYear } = req.body;
        const studentId = req.params.studentId;

        if (!grade || !academicYear || !studentId) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const result = await exports.performStudentAssignment(studentId, grade, academicYear);
        res.status(200).json({
            message: 'Student assigned to section successfully',
            student: result
        });
    } catch (error) {
        console.error('Error assigning student:', error);
        res.status(500).json({ message: 'Error assigning student', error: error.message });
    }
};

// Change student section (Admin only)
exports.changeStudentSection = async (req, res) => {
    try {
        const { studentId, newSection, grade, academicYear } = req.body;

        if (!studentId || !newSection || !grade || !academicYear) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const StudentProfile = mongoose.model('StudentProfile');
        const Classroom = mongoose.model('Classroom');

        // Get current student info
        const student = await StudentProfile.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const oldSectionName = student.section;
        const numericGradeStr = isNaN(parseInt(grade)) ? grade : parseInt(grade).toString();

        // 1. Find new section and check capacity
        const targetClassroom = await Classroom.findOne({ 
            classNumber: numericGradeStr, 
            section: newSection,
            academicYear 
        });

        if (!targetClassroom) return res.status(404).json({ message: 'Target section not found' });
        if (targetClassroom.studentIds.length >= targetClassroom.capacity) {
            return res.status(400).json({ message: 'Target section is at full capacity' });
        }

        // 2. Remove student from old section if it exists
        if (oldSectionName) {
            await Classroom.updateOne(
                { classNumber: numericGradeStr, section: oldSectionName, academicYear },
                { $pull: { studentIds: student.user || studentId } }
            );
        }

        // 3. Assign new roll in target section
        const newRollNumber = (targetClassroom.studentIds.length + 1).toString();
        
        // 4. Update Target Classroom
        targetClassroom.studentIds.push(student.user || studentId);
        await targetClassroom.save();

        // 5. Update Student Profile
        student.section = newSection;
        student.rollNumber = newRollNumber;
        await student.save();

        res.status(200).json({
            message: 'Student section changed successfully',
            student: {
                studentId: student.studentId,
                name: `${student.firstName} ${student.lastName}`,
                section: student.section,
                rollNumber: student.rollNumber
            }
        });
    } catch (error) {
        console.error('Error changing student section:', error);
        res.status(500).json({ message: 'Error changing student section', error: error.message });
    }
};

// Get section statistics
exports.getSectionStatistics = async (req, res) => {
    try {
        const { grade, academicYear } = req.query;

        if (!grade || !academicYear) {
            return res.status(400).json({ message: 'Grade and academicYear are required' });
        }

        const gradeConfig = await GradeSection.findOne({ grade, academicYear });

        if (!gradeConfig) {
            return res.status(404).json({ message: 'Grade configuration not found' });
        }

        const statistics = {
            grade,
            academicYear,
            totalCapacity: gradeConfig.totalCapacity,
            currentEnrollment: gradeConfig.currentEnrollment,
            occupancyPercentage: Math.round((gradeConfig.currentEnrollment / gradeConfig.totalCapacity) * 100),
            sections: gradeConfig.sections.map(section => ({
                sectionName: section.sectionName,
                maxCapacity: section.maxStudents,
                currentStudents: section.currentStudentCount,
                isFull: section.isFull,
                occupancyPercentage: Math.round((section.currentStudentCount / section.maxStudents) * 100)
            }))
        };

        res.status(200).json(statistics);
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ message: 'Error fetching statistics', error: error.message });
    }
};

// Get summary of all grades with sections and student counts
exports.getGradeSummary = async (req, res) => {
    try {
        const { academicYear = new Date().getFullYear().toString() } = req.query;

        // 1. Get all configured grades
        const gradeConfigs = await GradeSection.find({ academicYear }).sort({ grade: 1 });

        const summary = await Promise.all(gradeConfigs.map(async (gc) => {
            // 2. Count ALL students registered for this grade and year globally
            const totalRegistered = await StudentProfile.countDocuments({ 
                currentClass: gc.grade.toString(), 
                academicYear 
            });

            // 3. Find all classrooms (sections) deployed for this grade and year
            const classrooms = await mongoose.model('Classroom').find({ 
                classNumber: parseInt(gc.grade, 10),
                academicYear 
            }).populate('teacherId', 'name');
            
            // 4. Calculate total students successfully assigned and total seat capacity
            const totalAssigned = classrooms.reduce((sum, c) => sum + (c.studentIds?.length || 0), 0);
            const totalSeat = classrooms.reduce((sum, c) => sum + (c.capacity || 0), 0);

            return {
                grade: gc.grade,
                configId: gc._id,
                sectionCount: classrooms.length,
                totalRegistered,
                totalAssigned,
                totalSeat,
                totalCapacity: gc.totalCapacity,
                sections: classrooms.map(c => ({
                    _id: c._id,
                    name: c.name,
                    section: c.section,
                    teacher: c.teacherId?.name || 'Unassigned',
                    teacherId: c.teacherId?._id || c.teacherId, // Include ID for dropdown
                    studentCount: c.studentIds?.length || 0,
                    capacity: c.capacity || 30,
                    leadSubject: c.leadSubject || '',
                    leadSchedule: c.leadSchedule || [],
                    courses: c.courses || [],
                    isActive: c.isActive
                }))
            };
        }));

        res.status(200).json(summary);
    } catch (error) {
        console.error('Error fetching grade summary:', error);
        res.status(500).json({ message: 'Error fetching grade summary', error: error.message });
    }
};

exports.updateGradeConfiguration = async (req, res) => {
    try {
        const { grade, academicYear, totalCapacity } = req.body;
        const config = await GradeSection.findById(req.params.id);

        if (!config) {
            return res.status(404).json({ message: 'Grade configuration not found' });
        }

        const oldGrade = config.grade;
        const oldYear = config.academicYear;

        // Update the Grade Config
        if (grade) config.grade = grade;
        if (academicYear) config.academicYear = academicYear;
        if (totalCapacity) config.totalCapacity = totalCapacity;

        await config.save();

        // CASCADE: Update all existing sections (Classrooms) if the name or year changed
        // This ensures they stay visible in the summary table
        if (grade !== oldGrade || academicYear !== oldYear) {
            const Classroom = mongoose.model('Classroom');
            await Classroom.updateMany(
                { classNumber: oldGrade, academicYear: oldYear },
                { 
                    classNumber: grade || oldGrade, 
                    academicYear: academicYear || oldYear 
                }
            );
            
            // Also update Student Profiles so they stay in the right grade
            const StudentProfile = mongoose.model('StudentProfile');
            await StudentProfile.updateMany(
                { currentClass: oldGrade.toString(), academicYear: oldYear },
                { 
                    currentClass: (grade || oldGrade).toString(), 
                    academicYear: academicYear || oldYear 
                }
            );
        }

        res.status(200).json(config);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = exports;
