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

// Generate registration code for teacher
const generateRegistrationCode = () => {
    return crypto.randomBytes(16).toString('hex').substring(0, 12).toUpperCase();
};

// Add new teacher to database (Admin only)
exports.addTeacher = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { firstName, lastName, email, phone, gender, dateOfBirth, department, subject, employeeType } = req.body;

        // Validate input
        if (!firstName || !lastName || !email) {
            return res.status(400).json({ message: 'First name, last name, and email are required' });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const existingEmployee = await EmployeeID.findOne({ email });
        if (existingEmployee) {
            return res.status(400).json({ message: 'This email is already registered as an employee' });
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
            email,
            phone,
            gender,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            department,
            subject,
            status: 'pending',
            generatedBy: adminId,
            registrationCode: generateRegistrationCode(),
            codeExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
        });

        res.status(201).json({
            message: 'Employee record created successfully',
            employee: {
                employeeId: employee.employeeId,
                name: `${employee.firstName} ${employee.lastName}`,
                email: employee.email,
                employeeType: employee.employeeType,
                status: employee.status,
                registrationCode: employee.registrationCode,
                codeExpiry: employee.codeExpiry
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
        
        const employee = await EmployeeID.findOne({ employeeId });

        if (!employee) {
            return res.status(404).json({ message: 'Employee ID not found' });
        }

        if (employee.status !== 'pending') {
            return res.status(400).json({ message: 'This employee has already registered or is inactive' });
        }

        // Check if registration code has expired
        if (new Date() > employee.codeExpiry) {
            return res.status(400).json({ message: 'Registration link has expired. Contact admin to regenerate.' });
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

// Verify registration code (for teacher registration)
exports.verifyRegistrationCode = async (req, res) => {
    try {
        const { employeeId, registrationCode } = req.body;

        const employee = await EmployeeID.findOne({
            employeeId,
            registrationCode,
            status: 'pending'
        });

        if (!employee) {
            return res.status(400).json({ message: 'Invalid employee ID or registration code' });
        }

        if (new Date() > employee.codeExpiry) {
            return res.status(400).json({ message: 'Registration code has expired' });
        }

        res.status(200).json({
            message: 'Registration code verified',
            verified: true
        });
    } catch (error) {
        console.error('Error verifying code:', error);
        res.status(500).json({ message: 'Error verifying code', error: error.message });
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

// Regenerate registration code (Admin only)
exports.regenerateRegistrationCode = async (req, res) => {
    try {
        const employee = await EmployeeID.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        employee.registrationCode = generateRegistrationCode();
        employee.codeExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await employee.save();

        res.status(200).json({
            message: 'Registration code regenerated',
            registrationCode: employee.registrationCode,
            codeExpiry: employee.codeExpiry
        });
    } catch (error) {
        console.error('Error regenerating code:', error);
        res.status(500).json({ message: 'Error regenerating code', error: error.message });
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
