const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
    studentId: { type: String, unique: true }, // Format: YYCCSSSS (Year, Class, Sequence)
    applyingForClass: { type: String, required: true }, // e.g., '07'

    // Personal Info
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    religion: { type: String },
    bloodGroup: { type: String },
    identificationMarks: { type: String },
    medicalRecords: { type: String },
    studentPhoto: { type: String }, // File path

    // Parents Info
    fatherName: { type: String, required: true },
    fatherPhone: { type: String, required: true },
    fatherEmail: { type: String },
    fatherOccupation: { type: String },
    fatherPhoto: { type: String }, // File path

    motherName: { type: String, required: true },
    motherPhone: { type: String, required: true },
    motherEmail: { type: String },
    motherOccupation: { type: String },
    motherPhoto: { type: String }, // File path

    // Guardian Info (if different)
    guardianName: { type: String, required: true },
    guardianPhone: { type: String, required: true },
    guardianRelation: { type: String },
    guardianOccupation: { type: String },
    guardianEmail: { type: String },
    guardianPhoto: { type: String }, // File path

    // Address Info
    presentAddress: {
        district: String,
        division: String,
        thana: String,
        postOffice: String,
        details: String
    },
    permanentAddress: {
        district: String,
        division: String,
        thana: String,
        postOffice: String,
        details: String
    },

    // Academic Info
    previousSchool: { type: String },
    previousResultSheet: { type: String }, // File path

    // Documents (PDFs)
    documentsPdf: [{ type: String }], // Array of file paths

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to generate custom studentId: [YY][CC][SSSS]
admissionSchema.pre('save', async function () {
    if (this.isNew && !this.studentId && this.applyingForClass) {
        const year = new Date().getFullYear().toString().slice(-2); // e.g., '26'
        // pad Start the class to be 2 digits e.g "7" -> "07", "10" -> "10"
        const classCode = this.applyingForClass.padStart(2, '0');

        // Find the latest admission in the same year and class
        const prefixRegex = new RegExp(`^${year}${classCode}`);
        const lastAdmission = await mongoose.model('Admission').findOne({
            studentId: prefixRegex
        }).sort({ studentId: -1 });

        let sequence = 1;
        if (lastAdmission && lastAdmission.studentId) {
            // Extract the sequence part (last 4 characters)
            const lastSeqStr = lastAdmission.studentId.slice(4);
            sequence = parseInt(lastSeqStr, 10) + 1;
        }

        const seqCode = sequence.toString().padStart(4, '0');
        this.studentId = `${year}${classCode}${seqCode}`; // e.g., 26070001
    }
});

const Admission = mongoose.model('Admission', admissionSchema);
module.exports = Admission;
