const mongoose = require('mongoose');
require('dotenv').config();
const Admission = require('./models/Admission');

const uri = process.env.MONGODB_URI;

async function run() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to DB.");

        // Clear existing test data
        await Admission.deleteMany({});

        const testApps = [
            {
                studentId: "26080001",
                applyingForClass: "08",
                firstName: "Aarika",
                lastName: "Rahman",
                dateOfBirth: new Date("2012-05-15"),
                gender: "Female",
                bloodGroup: "O+",
                previousSchool: "Sunrise Academy",
                fatherName: "Shafiqur Rahman",
                fatherPhone: "01711000000",
                motherName: "Salma Begum",
                motherPhone: "01811000000",
                guardianName: "Shafiqur Rahman",
                guardianRelation: "Father",
                guardianPhone: "01711000000",
                guardianEmail: "shafiq@example.com",
                presentAddress: JSON.stringify({ details: "House 12, Road 4, Dhanmondi, Dhaka" }),
                permanentAddress: JSON.stringify({ details: "House 12, Road 4, Dhanmondi, Dhaka" }),
                academicHistory: JSON.stringify([{ exam: "Class 7 Final", year: "2025", grade: "A+" }]),
                status: "pending"
            },
            {
                studentId: "26090001",
                applyingForClass: "09",
                firstName: "Farhan",
                lastName: "Ahmed",
                dateOfBirth: new Date("2011-09-20"),
                gender: "Male",
                bloodGroup: "B+",
                previousSchool: "Green Valley School",
                fatherName: "Jamal Ahmed",
                fatherPhone: "01911000000",
                motherName: "Dilara Yasmin",
                motherPhone: "01611000000",
                guardianName: "Jamal Ahmed",
                guardianRelation: "Father",
                guardianPhone: "01911000000",
                guardianEmail: "jamal@example.com",
                presentAddress: JSON.stringify({ details: "Flat 4B, Gulshan Avenue, Dhaka" }),
                permanentAddress: JSON.stringify({ details: "Flat 4B, Gulshan Avenue, Dhaka" }),
                academicHistory: JSON.stringify([{ exam: "Class 8 Final", year: "2025", grade: "A" }]),
                status: "pending"
            }
        ];

        await Admission.insertMany(testApps);
        console.log("Successfully inserted 2 dummy admission applications for pending review.");

    } catch (err) {
        console.error("Test Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
