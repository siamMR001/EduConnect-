const EmployeeID = require('../models/EmployeeID');
const User = require('../models/User');
const crypto = require('crypto');

// Generate unique Employee ID (e.g., TCH-2026-001)
const generateUniqueEmployeeId = async (employeeType) => {
    const year = new Date().getFullYear();
    const prefix = employeeType === 'teacher' ? 'TCH' : employeeType === 'admin' ? 'ADM' : 'STF';
    
    const lastEmployee = await EmployeeID.findOne({ employeeId: new RegExp(`^${prefix}-${year}`) }).sort({ employeeId: -1 });
    const nextNumber = lastEmployee ? parseInt(lastEmployee.employeeId.split('-')[2]) + 1 : 1;
    
    return `${prefix}-${year}-${String(nextNumber).padStart(4, '0')}`;
};

// Add new teacher to database (Admin only)
exports.addTeacher = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { firstName, lastName, email, phone, gender, dateOfBirth, department, subject, employeeType } = req.body;

        // Validate input
        if (!firstName || !lastName) {
            return res.status(400).json({ message: 'First name and last name are required' });
        }

        // Generate unique employee ID
        const type = employeeType || 'teacher';
        const employeeId = await generateUniqueEmployeeId(type);

        // Create employee record
        const employee = await EmployeeID.create({
            employeeId,
            employeeType: type,
            firstName,
            lastName,
            phone,
            gender,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            department,
            subject,
            status: 'active',
            generatedBy: adminId
        });

        res.status(201).json({
            message: 'Employee record created successfully',
            employee: {
                employeeId: employee.employeeId,
                name: `${employee.firstName} ${employee.lastName}`,
                employeeType: employee.employeeType,
                status: employee.status
            }
        });
    } catch (error) {
        console.error('Error adding teacher:', error);
        res.status(500).json({ message: 'Error adding teacher', error: error.message });
    }
};

// Get all employees (Admin only)
exports.getAllEmployees = async (req, res) => {
    try {
        const { status, employeeType } = req.query;
        
        let filter = {};
        if (status) filter.status = status;
        if (employeeType) filter.employeeType = employeeType;

        const employees = await EmployeeID.find(filter)
            .populate('user', 'email')
            .populate('generatedBy', 'name email')
            .sort({ generatedAt: -1 });

        res.status(200).json({
            total: employees.length,
            employees
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ message: 'Error fetching employees', error: error.message });
    }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
    try {
        const employee = await EmployeeID.findById(req.params.id)
            .populate('user', '-password')
            .populate('generatedBy', 'name email');

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json(employee);
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ message: 'Error fetching employee', error: error.message });
    }
};

// Get employee by Employee ID (for registration link)
exports.getEmployeeByEmployeeId = async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        const employee = await EmployeeID.findOne({ 
            employeeId: employeeId.trim() 
        }).collation({ locale: 'en', strength: 2 });

        if (!employee) {
            return res.status(404).json({ message: 'Employee ID not found' });
        }

        if (employee.status === 'inactive') {
            return res.status(400).json({ message: 'This employee account is inactive. Please contact admin.' });
        }

        if (employee.user) {
            return res.status(400).json({ message: 'This employee has already registered and linked an account.' });
        }



        res.status(200).json({
            employeeId: employee.employeeId,
            name: `${employee.firstName} ${employee.lastName}`,
            email: employee.email,
            employeeType: employee.employeeType,
            status: employee.status
        });
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ message: 'Error fetching employee', error: error.message });
    }
};


// Update employee record details (Admin only)
exports.updateEmployee = async (req, res) => {
    try {
        console.log('Updating Employee ID:', req.params.id);
        console.log('Update Data Received:', req.body);
        
        const updateData = { ...req.body };
        
        // Clean data: Aggressively convert/remove empty strings to avoid validation/enum errors
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === '' || updateData[key] === 'undefined' || updateData[key] === 'null') {
                // For fields that allow null (like sparse unique email/phone), set to null
                if (['email', 'phone', 'dateOfBirth', 'gender', 'maritalStatus'].includes(key)) {
                    updateData[key] = null;
                } else {
                    // For other fields, delete from object to keep existing value and avoid validation failure
                    delete updateData[key];
                }
            }
        });

        // Additional validation for dates
        if (updateData.dateOfBirth && isNaN(new Date(updateData.dateOfBirth).getTime())) {
            updateData.dateOfBirth = null;
        }

        // Check for email collision manually for better error reporting
        if (updateData.email) {
            const existingEmail = await EmployeeID.findOne({ 
                email: updateData.email.toLowerCase().trim(), 
                _id: { $ne: req.params.id } 
            });
            if (existingEmail) {
                return res.status(400).json({ message: `The email address '${updateData.email}' is already linked to another employee.` });
            }
        }

        // Handle file uploads if present
        if (req.files) {
            if (req.files['profilePicture']) {
                const pic = req.files['profilePicture'][0];
                updateData.profilePicture = `/uploads/teacher_docs/${pic.filename}`;
            }
            if (req.files['professionalDocs']) {
                const doc = req.files['professionalDocs'][0];
                // Map consolidated PDF to cvDocument and nidDocument for consistency
                const filePath = `/uploads/teacher_docs/${doc.filename}`;
                updateData.cvDocument = filePath;
                updateData.nidDocument = filePath;
            }
        }

        const employee = await EmployeeID.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json({
            message: 'Employee record updated successfully',
            employee
        });
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ message: 'Error updating employee', error: error.message });
    }
};

// Update employee status (Admin only)
exports.updateEmployeeStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'active', 'inactive'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const employee = await EmployeeID.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json({
            message: 'Employee status updated successfully',
            employee
        });
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ message: 'Error updating employee', error: error.message });
    }
};


// Get teacher profile (for logged in teacher)
exports.getTeacherProfile = async (req, res) => {
    try {
        const employee = await EmployeeID.findOne({ user: req.user._id });
        if (!employee) {
            return res.status(404).json({ message: 'Teacher profile not found' });
        }
        res.status(200).json(employee);
    } catch (error) {
        console.error('Error fetching teacher profile:', error);
        res.status(500).json({ message: 'Error fetching teacher profile', error: error.message });
    }
};

// Delete employee record (Admin only)
exports.deleteEmployee = async (req, res) => {
    try {
        const employee = await EmployeeID.findByIdAndDelete(req.params.id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json({
            message: 'Employee record deleted successfully',
            employee
        });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ message: 'Error deleting employee', error: error.message });
    }
};
