const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const teacherService = {
  // Get all employees with optional filters
  getAllEmployees: async (filters = {}) => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(
      `${API_URL}/teachers/all-employees${queryParams ? '?' + queryParams : ''}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch employees');
    }
    return response.json();
  },

  // Get specific employee by ID
  getEmployeeById: async (id) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/teachers/employee/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch employee');
    }
    return response.json();
  },

  // Get employee by Employee ID (for registration page - public)
  getEmployeeByEmployeeId: async (employeeId) => {
    const response = await fetch(`${API_URL}/teachers/by-employee-id/${employeeId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Employee ID not found');
    }
    return response.json();
  },

  // Add new teacher (admin only)
  addTeacher: async (teacherData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/teachers/add-teacher`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teacherData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add teacher');
    }
    return response.json();
  },

  // Verify registration code (public)
  verifyRegistrationCode: async (employeeId, registrationCode) => {
    const response = await fetch(`${API_URL}/teachers/verify-registration-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ employeeId, registrationCode }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Invalid registration code');
    }
    return response.json();
  },

  // Update employee status (admin only)
  updateEmployeeStatus: async (id, status) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/teachers/employee/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update employee status');
    }
    return response.json();
  },

  // Regenerate registration code (admin only)
  regenerateRegistrationCode: async (id) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/teachers/employee/${id}/regenerate-code`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to regenerate registration code');
    }
    return response.json();
  },

  // Delete employee (admin only)
  deleteEmployee: async (id) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/teachers/employee/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete employee');
    }
    return response.json();
  },

  // Register teacher (public - self-service)
  registerTeacher: async (registrationData) => {
    const response = await fetch(`${API_URL}/auth/register-teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }
    return response.json();
  },
};

export default teacherService;
