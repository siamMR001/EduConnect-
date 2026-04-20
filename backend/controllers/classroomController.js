const Classroom = require('../models/Classroom');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Result = require('../models/Result');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const StudentProfile = require('../models/StudentProfile');
const { sendNotification } = require('./notificationController');
const xlsx = require('xlsx');

// --- Classroom Management ---

exports.createClassroom = async (req, res) => {
    try {
        const { classNumber, section, teacherId, capacity, leadSubject, leadSchedule, courses, academicYear } = req.body;
        
        if (!classNumber || !section || !teacherId || !leadSubject || !academicYear) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const name = `Class ${classNumber} — ${section}`;
        const finalCapacity = parseInt(capacity, 10) || 30;

        // Check if there is already this exact section for this class
        const existing = await Classroom.findOne({ classNumber, section });
        if (existing) {
            return res.status(400).json({ message: 'This section identity already exists for this grade' });
        }

        const classroom = new Classroom({
            name,
            classNumber,
            section,
            teacherId,
            capacity: finalCapacity,
            leadSubject,
            leadSchedule: leadSchedule || [],
            courses: (courses || []).map(c => ({
                ...c,
                teacherId: c.teacherId === '' ? null : c.teacherId
            })),
            academicYear,
            isActive: true // Newly deployed sections are active by default now
        });

        // --- Auto-assign students who have already registered ---
        let classProfiles = await StudentProfile.find({ user: { $ne: null } });
        classProfiles = classProfiles.filter(p => parseInt(p.currentClass, 10) === parseInt(classNumber, 10));

        // Sort by profile creation date
        classProfiles.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateA - dateB;
        });

        // Calculate offset based on sum of capacities of previous sections
        const previousSections = await Classroom.find({ classNumber });
        const totalPreviousCapacity = previousSections.reduce((sum, s) => sum + (s.capacity || 30), 0);
        
        const startIndex = totalPreviousCapacity;
        const endIndex = startIndex + finalCapacity;
        const profilesForThisSection = classProfiles.slice(startIndex, endIndex);

        // Add their Object IDs to the classroom
        classroom.studentIds = profilesForThisSection.map(p => p.user);
        
        await classroom.save();
        res.status(201).json(classroom);
    } catch (error) {
        console.error('Error creating classroom:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.activateSection = async (req, res) => {
    try {
        const classroom = await Classroom.findById(req.params.id);
        if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
        
        // Find existing sections for this class number
        const classSections = await Classroom.find({ classNumber: classroom.classNumber });
        
        // Check if any active section has reached 30 capacity before allowing activation
        if (classSections.length > 1) {
            const hasFullSection = classSections.some(c => c.isActive && c.studentIds.length >= 30);
            if (!hasFullSection && !classroom.isActive) {
                return res.status(400).json({ message: 'The first section must reach its 30-student capacity before the second section can be activated.' });
            }
        }
        
        classroom.isActive = true;
        await classroom.save();
        res.status(200).json(classroom);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getClassrooms = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'teacher') {
            query.teacherId = req.user._id;
        } else if (req.user.role === 'student') {
            query.studentIds = req.user._id;
        }

        const classrooms = await Classroom.find(query).populate('teacherId', 'name email');
        res.status(200).json(classrooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSingleClassroom = async (req, res) => {
    try {
        const classroom = await Classroom.findById(req.params.id)
            .populate('teacherId', 'name email')
            .populate('courses.teacherId', 'name email')
            .populate({
                path: 'studentIds',
                select: 'name email studentProfile',
                populate: [
                    { path: 'studentProfile', select: 'studentId rollNumber' },
                    { path: 'profile', select: 'studentId rollNumber' }
                ]
            });
        if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

        // Authorization check: Students can only access their own classroom
        if (req.user.role === 'student') {
            const isStudentInClass = classroom.studentIds.some(s => s._id.toString() === req.user._id.toString());
            if (!isStudentInClass) {
                return res.status(403).json({ message: 'Not authorized: You are not enrolled in this section.' });
            }
        }

        res.status(200).json(classroom);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.enrollStudent = async (req, res) => {
    try {
        const { studentId } = req.body;
        const classroom = await Classroom.findById(req.params.id);
        if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
        
        if (classroom.studentIds.length >= 30) {
            return res.status(400).json({ message: 'Hard capacity of 30 students reached' });
        }

        if (!classroom.studentIds.includes(studentId)) {
            classroom.studentIds.push(studentId);
            await classroom.save();
        }
        res.status(200).json(classroom);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher' }).select('name email');
        res.status(200).json(teachers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStudents = async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('name email');
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Feed (Posts & Comments) ---

exports.createPost = async (req, res) => {
    try {
        const { title, body, attachmentUrl } = req.body;
        const classroom = await Classroom.findById(req.params.id);
        if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
        
        if (req.user.role !== 'teacher' || classroom.teacherId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const post = new Post({
            classroomId: classroom._id,
            teacherId: req.user._id,
            title,
            body,
            attachmentUrl
        });
        await post.save();

        // Trigger push notification for all students enrolled in this classroom
        for (const studentId of classroom.studentIds) {
            await sendNotification(
                studentId,
                `New Post: ${title}`,
                `${req.user.name} posted a new update in ${classroom.name}`,
                'message',
                'normal',
                post._id,
                `/classrooms/${classroom._id}`
            );
        }
        
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPosts = async (req, res) => {
    try {
        const posts = await Post.find({ classroomId: req.params.id }).sort({ createdAt: -1 }).populate('teacherId', 'name email');
        const postsWithComments = await Promise.all(posts.map(async post => {
            const comments = await Comment.find({ postId: post._id }).sort({ createdAt: 1 }).populate('authorId', 'name');
            return { ...post.toObject(), comments };
        }));
        res.status(200).json(postsWithComments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.teacherId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await Post.findByIdAndDelete(req.params.postId);
        await Comment.deleteMany({ postId: req.params.postId });
        res.status(200).json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createComment = async (req, res) => {
    try {
        const { text } = req.body;
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = new Comment({
            postId: post._id,
            authorId: req.user._id,
            authorRole: req.user.role,
            text
        });
        await comment.save();
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });
        if (comment.authorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await Comment.findByIdAndDelete(req.params.commentId);
        res.status(200).json({ message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Assignments ---
// Note: Handled by extending existing Assignment routes/controllers or here
exports.createAssignment = async (req, res) => {
    try {
        const { title, description, subject, dueDate, attachmentUrl, totalMarks } = req.body;
        const assignment = new Assignment({
            title, description, subject, dueDate, attachmentUrl,
            classroomId: req.params.id,
            teacherId: req.user._id,
            createdBy: req.user._id, // fallback for old schema
            deadline: dueDate, // fallback
            class: 'N/A', // fallback
            totalMarks: totalMarks || 100
        });
        await assignment.save();
        // Trigger push notifications
        const classroom = await Classroom.findById(req.params.id);
        if (classroom && classroom.studentIds) {
            for (const studentId of classroom.studentIds) {
                await sendNotification(
                    studentId,
                    `New Assignment: ${title}`,
                    `${req.user.name} posted a new assignment for ${subject}`,
                    'alert',
                    'high',
                    assignment._id,
                    `/classrooms/${classroom._id}`
                );
            }
        }
        res.status(201).json(assignment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find({ classroomId: req.params.id }).sort({ createdAt: -1 });
        
        // Include submission status logic for current user if student
        const result = await Promise.all(assignments.map(async a => {
            let userSubmission = null;
            if (req.user.role === 'student') {
                userSubmission = await Submission.findOne({ assignment: a._id, student: req.user._id });
            }
            let allSubmissions = [];
            if (req.user.role === 'teacher' || req.user.role === 'admin') {
                allSubmissions = await Submission.find({ assignment: a._id }).populate('student', 'name');
            }
            return {
                ...a.toObject(),
                userSubmission,
                allSubmissions
            };
        }));

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.submitAssignment = async (req, res) => {
    try {
        const { fileUrl } = req.body;
        const assignment = await Assignment.findById(req.params.assignmentId);
        if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

        const now = new Date();
        const isLate = now > assignment.dueDate;
        
        const existing = await Submission.findOne({ assignment: assignment._id, student: req.user._id });
        if (existing) {
            return res.status(400).json({ message: 'Already submitted' });
        }

        const submission = new Submission({
            assignment: assignment._id,
            student: req.user._id,
            fileUrl,
            submittedFiles: [{ filename: fileUrl, path: fileUrl }], // fallback limit
            status: isLate ? 'late' : 'submitted',
            isLate
        });
        
        await submission.save();
        res.status(201).json(submission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Results & Gradesheet ---

exports.downloadResultTemplate = async (req, res) => {
    try {
        const classroom = await Classroom.findById(req.params.id).populate('studentIds', 'name _id');
        if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

        const data = classroom.studentIds.map((student, index) => ({
            'Roll Number': index + 1,
            'Student ID': student._id.toString(),
            'Student Name': student.name,
            'Subject 1 Name': '',
            'Subject 1 Marks': '',
            'Subject 1 Total': '',
            'Subject 2 Name': '',
            'Subject 2 Marks': '',
            'Subject 2 Total': ''
        }));

        const ws = xlsx.utils.json_to_sheet(data);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Template");

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Template.xlsx');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const calcGrade = (marks, total) => {
    const p = (marks / total) * 100;
    if (p >= 90) return { grade: 'A+', points: 4.0 };
    if (p >= 80) return { grade: 'A', points: 3.7 };
    if (p >= 70) return { grade: 'A-', points: 3.3 };
    if (p >= 60) return { grade: 'B', points: 3.0 };
    if (p >= 50) return { grade: 'C', points: 2.0 };
    return { grade: 'F', points: 0.0 };
};

exports.uploadResults = async (req, res) => {
    try {
        const { examName } = req.body;
        if (!examName) return res.status(400).json({ message: 'examName is required' });
        if (!req.file) return res.status(400).json({ message: 'Spreadsheet file is required' });

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        for (const row of data) {
            const studentId = row['Student ID'];
            if (!studentId) continue;
            
            let totalPoints = 0;
            let subjectCount = 0;
            const subjects = [];

            // Quick extraction of subjects (assuming pairs of name, marks, total)
            for (let i = 1; i <= 10; i++) {
                const subName = row[`Subject ${i} Name`];
                const subMarks = row[`Subject ${i} Marks`];
                const subTotal = row[`Subject ${i} Total`];

                if (subName && subMarks !== undefined && subTotal !== undefined) {
                    const { grade, points } = calcGrade(subMarks, subTotal);
                    subjects.push({ name: subName, marksObtained: subMarks, totalMarks: subTotal, grade });
                    totalPoints += points;
                    subjectCount++;
                }
            }

            if (subjectCount > 0) {
                const gpa = totalPoints / subjectCount;
                const result = new Result({
                    classroomId: req.params.id,
                    studentId,
                    examName,
                    subjects,
                    gpa
                });
                await result.save();
            }
        }

        res.status(200).json({ message: 'Results uploaded successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getClassroomResults = async (req, res) => {
    try {
        let query = { classroomId: req.params.id };
        if (req.user.role === 'student') {
            query.studentId = req.user._id;
        }
        const results = await Result.find(query).populate('studentId', 'name').sort({ uploadedAt: -1 });
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getGlobalGradesheet = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'student') {
            query.studentId = req.user._id;
        } else if (req.query.search) {
             const users = await User.find({ name: new RegExp(req.query.search, 'i'), role: 'student' });
             query.studentId = { $in: users.map(u => u._id) };
        } else if (req.query.studentId) {
             query.studentId = req.query.studentId;
        }
        
        if (req.user.role === 'admin') {
            if (req.query.examName) query.examName = new RegExp(req.query.examName, 'i');
        }

        const results = await Result.find(query)
            .populate('studentId', 'name email')
            .populate('classroomId', 'name classNumber section')
            .sort({ uploadedAt: -1 });
            
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteResult = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const result = await Result.findByIdAndDelete(req.params.resultId);
        if (!result) return res.status(404).json({ message: 'Result not found' });
        res.status(200).json({ message: 'Result deleted successfully' });
    } catch (error) {
         res.status(500).json({ message: error.message });
    }
};

exports.updateClassroom = async (req, res) => {
    try {
        const { id } = req.params;
        const { section, teacherId, capacity, leadSubject, leadSchedule, courses, isActive, name } = req.body;

        const updatedData = {
            name,
            section,
            teacherId,
            capacity,
            leadSubject,
            leadSchedule: leadSchedule || [],
            courses: (courses || []).map(c => ({
                ...c,
                teacherId: c.teacherId === '' ? null : c.teacherId
            })),
            isActive
        };

        // Remove undefined fields
        Object.keys(updatedData).forEach(key => {
            if (updatedData[key] === undefined) delete updatedData[key];
        });

        const classroom = await Classroom.findByIdAndUpdate(id, updatedData, { new: true });
        if (!classroom) return res.status(404).json({ message: 'Section not found' });

        res.status(200).json(classroom);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.activateSection = async (req, res) => {
    try {
        const { id } = req.params;
        const classroom = await Classroom.findById(id);
        if (!classroom) return res.status(404).json({ message: 'Section not found' });

        classroom.isActive = !classroom.isActive;
        await classroom.save();
        res.status(200).json(classroom);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteClassroom = async (req, res) => {
    try {
        const { id } = req.params;
        const classroom = await Classroom.findByIdAndDelete(id);
        if (!classroom) return res.status(404).json({ message: 'Section not found' });
        res.status(200).json({ message: 'Section deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


