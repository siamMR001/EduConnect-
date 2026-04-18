const cron = require('node-cron');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User = require('../models/User');
const Classroom = require('../models/Classroom');

// Runs nightly at midnight
const markLateAssignments = cron.schedule('0 0 * * *', async () => {
    try {
        console.log('Running nightly cron job to check for late assignments...');
        const now = new Date();

        // 1. Find all assignments that are past their due date
        // Since we are adding dueDate as a new field, we will check that
        const pastDueAssignments = await Assignment.find({ dueDate: { $lt: now } });

        for (let assignment of pastDueAssignments) {
            // Find the classroom to get student list
            if (!assignment.classroomId) continue;

            const classroom = await Classroom.findById(assignment.classroomId);
            if (!classroom || !classroom.studentIds) continue;

            // Check if every student has a submission. If not, create a late block
            for (let studentId of classroom.studentIds) {
                const existingSubmission = await Submission.findOne({ 
                    assignment: assignment._id, 
                    student: studentId 
                });

                if (!existingSubmission) {
                    // Create pending submission marked as late
                    const lateSubmission = new Submission({
                        assignment: assignment._id,
                        student: studentId,
                        status: 'late',
                        isLate: true
                    });
                    await lateSubmission.save();
                } else if (existingSubmission.status === 'pending' && !existingSubmission.isLate) {
                     existingSubmission.status = 'late';
                     existingSubmission.isLate = true;
                     await existingSubmission.save();
                }
            }
        }
        console.log('Finished nightly cron job for assignments.');
    } catch (err) {
        console.error('Error running assignment cron job:', err);
    }
});

module.exports = { markLateAssignments };
