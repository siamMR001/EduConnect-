const Timetable = require('../models/Timetable');
const Classroom = require('../models/Classroom');
const User = require('../models/User');

/**
 * @desc    Add a slot to the timetable
 * @route   POST /api/timetable
 * @access  Private (Admin)
 */
exports.addTimeSlot = async (req, res) => {
    try {
        const { classroom: classroomId, subject, teacher, day, startTime, endTime, roomNumber, academicYear } = req.body;

        if (!classroomId || !subject || !teacher || !day || !startTime || !endTime || !academicYear) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // 1. Conflict Check: Teacher
        // Check if teacher has any class during this time in ANY classroom
        const teacherConflict = await Timetable.findOne({
            teacher,
            day,
            academicYear,
            $or: [
                {
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime }
                }
            ]
        }).populate('classroom', 'name');

        if (teacherConflict) {
            return res.status(400).json({
                message: `Teacher Conflict: This teacher is already assigned to ${teacherConflict.classroom.name} on ${day} from ${teacherConflict.startTime} to ${teacherConflict.endTime}.`
            });
        }

        // 2. Conflict Check: Section (Classroom)
        // Check if this classroom already has a class during this time
        const classroomConflict = await Timetable.findOne({
            classroom: classroomId,
            day,
            academicYear,
            $or: [
                {
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime }
                }
            ]
        });

        if (classroomConflict) {
            return res.status(400).json({
                message: `Section Conflict: This section already has a ${classroomConflict.subject} class scheduled on ${day} from ${classroomConflict.startTime} to ${classroomConflict.endTime}.`
            });
        }

        // 3. Conflict Check: Room (Optional but good for real-life)
        if (roomNumber) {
            const roomConflict = await Timetable.findOne({
                roomNumber,
                day,
                academicYear,
                $or: [
                    {
                        startTime: { $lt: endTime },
                        endTime: { $gt: startTime }
                    }
                ]
            }).populate('classroom', 'name');

            if (roomConflict) {
                return res.status(400).json({
                    message: `Room Conflict: Room ${roomNumber} is already occupied by ${roomConflict.classroom.name} on ${day} during this time.`
                });
            }
        }

        const newSlot = new Timetable({
            classroom: classroomId,
            subject,
            teacher,
            day,
            startTime,
            endTime,
            roomNumber,
            academicYear
        });

        await newSlot.save();
        res.status(201).json(newSlot);
    } catch (error) {
        console.error('Timetable Error:', error);
        res.status(500).json({ message: 'Error adding timetable slot', error: error.message });
    }
};

/**
 * @desc    Get timetable for a specific classroom
 * @route   GET /api/timetable/classroom/:classroomId
 * @access  Private (Teacher/Student/Admin)
 */
exports.getClassroomTimetable = async (req, res) => {
    try {
        const { academicYear } = req.query;
        const query = { classroom: req.params.classroomId };
        if (academicYear) query.academicYear = academicYear;

        const timetable = await Timetable.find(query)
            .populate('teacher', 'name email')
            .sort({ day: 1, startTime: 1 });

        res.status(200).json(timetable);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching timetable', error: error.message });
    }
};

/**
 * @desc    Get timetable for a specific teacher
 * @route   GET /api/timetable/teacher/:teacherId
 * @access  Private (Teacher/Admin)
 */
exports.getTeacherTimetable = async (req, res) => {
    try {
        const { academicYear } = req.query;
        const query = { teacher: req.params.teacherId };
        if (academicYear) query.academicYear = academicYear;

        const timetable = await Timetable.find(query)
            .populate('classroom', 'name classNumber section')
            .sort({ day: 1, startTime: 1 });

        res.status(200).json(timetable);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching teacher timetable', error: error.message });
    }
};

/**
 * @desc    Delete a timetable slot
 * @route   DELETE /api/timetable/:id
 * @access  Private (Admin)
 */
exports.deleteTimeSlot = async (req, res) => {
    try {
        const slot = await Timetable.findByIdAndDelete(req.params.id);
        if (!slot) return res.status(404).json({ message: 'Slot not found' });
        res.status(200).json({ message: 'Slot removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting slot', error: error.message });
    }
};

module.exports = exports;
