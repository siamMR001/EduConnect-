const GradeSection = require('../models/GradeSection');
const StudentProfile = require('../models/StudentProfile');

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
            // Update existing
            gradeConfig.maxSections = maxSections;
            gradeConfig.sections = sections || [];
            gradeConfig.updatedAt = new Date();
            await gradeConfig.save();

            return res.status(200).json({
                message: 'Grade configuration updated successfully',
                gradeConfig
            });
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

        const gradeConfigs = await GradeSection.find(filter).sort({ grade: 1 });

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

// Update section max capacity (Admin only)
exports.updateSectionCapacity = async (req, res) => {
    try {
        const { grade, academicYear, sectionName, maxStudents } = req.body;

        if (!grade || !academicYear || !sectionName || !maxStudents) {
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

        gradeConfig.sections[sectionIndex].maxStudents = maxStudents;
        gradeConfig.totalCapacity = gradeConfig.sections.reduce((sum, s) => sum + s.maxStudents, 0);
        gradeConfig.updatedAt = new Date();

        await gradeConfig.save();

        res.status(200).json({
            message: 'Section capacity updated successfully',
            gradeConfig
        });
    } catch (error) {
        console.error('Error updating section capacity:', error);
        res.status(500).json({ message: 'Error updating section capacity', error: error.message });
    }
};

// Assign student to next available section (used during student enrollment)
exports.assignStudentToSection = async (req, res) => {
    try {
        const { grade, academicYear } = req.body;
        const studentId = req.params.studentId;

        if (!grade || !academicYear || !studentId) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Find grade configuration
        const gradeConfig = await GradeSection.findOne({ grade, academicYear });

        if (!gradeConfig) {
            return res.status(400).json({ message: 'Grade configuration not found' });
        }

        // Find the first available section (not full)
        const availableSection = gradeConfig.sections.find(s => s.currentStudentCount < s.maxStudents);

        if (!availableSection) {
            return res.status(400).json({ message: 'No available seats in any section for this grade' });
        }

        // Calculate roll number (sequential across all students in section)
        const rollNumber = availableSection.currentStudentCount + 1;

        // Update student profile
        const student = await StudentProfile.findByIdAndUpdate(
            studentId,
            {
                section: availableSection.sectionName,
                rollNumber,
                academicYear
            },
            { new: true }
        );

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Update section count
        availableSection.currentStudentCount++;
        if (availableSection.currentStudentCount >= availableSection.maxStudents) {
            availableSection.isFull = true;
        }

        gradeConfig.currentEnrollment++;
        gradeConfig.updatedAt = new Date();

        await gradeConfig.save();

        res.status(200).json({
            message: 'Student assigned to section successfully',
            student: {
                studentId: student.studentId,
                name: `${student.firstName} ${student.lastName}`,
                section: student.section,
                rollNumber: student.rollNumber,
                grade: student.currentClass
            }
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

        // Get current student info
        const student = await StudentProfile.findById(studentId);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Find grade configuration
        const gradeConfig = await GradeSection.findOne({ grade, academicYear });

        if (!gradeConfig) {
            return res.status(400).json({ message: 'Grade configuration not found' });
        }

        // Find old and new section
        const oldSection = gradeConfig.sections.find(s => s.sectionName === student.section);
        const newSectionObj = gradeConfig.sections.find(s => s.sectionName === newSection);

        if (!newSectionObj) {
            return res.status(404).json({ message: 'New section not found' });
        }

        // Check if new section has capacity
        if (newSectionObj.currentStudentCount >= newSectionObj.maxStudents) {
            return res.status(400).json({ message: 'New section is at full capacity' });
        }

        // Update counts
        if (oldSection && student.section !== newSection) {
            oldSection.currentStudentCount--;
            oldSection.isFull = false;
        }

        // Calculate new roll number
        const newRollNumber = newSectionObj.currentStudentCount + 1;
        newSectionObj.currentStudentCount++;

        if (newSectionObj.currentStudentCount >= newSectionObj.maxStudents) {
            newSectionObj.isFull = true;
        }

        // Update student
        student.section = newSection;
        student.rollNumber = newRollNumber;
        await student.save();

        gradeConfig.updatedAt = new Date();
        await gradeConfig.save();

        res.status(200).json({
            message: 'Student section changed successfully',
            student: {
                studentId: student.studentId,
                name: `${student.firstName} ${student.lastName}`,
                oldSection: oldSection?.sectionName,
                newSection: student.section,
                newRollNumber: student.rollNumber
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
