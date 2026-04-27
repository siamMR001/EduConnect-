const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
    studentId: { type: String, unique: true }, // Format: YYCCSSSS (Year, Class, Sequence)
    applyingForClass: { type: String, required: true }, // e.g., '07'
    amount: { type: Number, default: 0 },

    // Personal Info
    firstName: { type: String },
    lastName: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    religion: { type: String },
    bloodGroup: { type: String },
    identificationMarks: { type: String },
    medicalRecords: { type: String },
    studentPhoto: { type: String }, // File path

    // Parents Info
    fatherName: { type: String },
    fatherPhone: { type: String },
    fatherEmail: { type: String },
    fatherOccupation: { type: String },
    fatherPhoto: { type: String }, // File path

    motherName: { type: String },
    motherPhone: { type: String },
    motherEmail: { type: String },
    motherOccupation: { type: String },
    motherPhoto: { type: String }, // File path

    // Guardian Info (if different)
    guardianName: { type: String },
    guardianPhone: { type: String },
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
    paymentStatus: {
        type: String,
        enum: ['paid', 'unpaid', 'pending_verification'],
        default: 'unpaid'
    },
    paymentMethod: {
        type: String,
        enum: ['stripe', 'stripe_mock', 'stripe_checkout', 'apple_pay', 'google_pay', 'bkash', 'rocket', 'nagad', 'bank_transfer']
    },
    transactionId: { type: String },
    paymentProof: { type: String }, // File path for bank receipt
    paymentIntentId: { type: String },
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
        // Find the latest ID in Admissions
        const lastInAdmissions = await mongoose.model('Admission').findOne({
            studentId: prefixRegex
        }).sort({ studentId: -1 });

        // Find the latest ID in StudentProfiles
        const lastInProfiles = await mongoose.model('StudentProfile').findOne({
            studentId: prefixRegex
        }).sort({ studentId: -1 });

        let sequence = 1;
        
        // Extract sequence from both and find the actual max
        const seqFromAdmissions = lastInAdmissions?.studentId ? parseInt(lastInAdmissions.studentId.slice(4), 10) : 0;
        const seqFromProfiles = lastInProfiles?.studentId ? parseInt(lastInProfiles.studentId.slice(4), 10) : 0;
        
        sequence = Math.max(seqFromAdmissions, seqFromProfiles) + 1;

        const seqCode = sequence.toString().padStart(4, '0');
        this.studentId = `${year}${classCode}${seqCode}`; // e.g., 26070001
    }
});

const Admission = mongoose.model('Admission', admissionSchema);
module.exports = Admission;
