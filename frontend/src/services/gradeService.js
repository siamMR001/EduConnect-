const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const API_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

const gradeService = {
  // Create grade configuration (admin only)
  createGradeConfiguration: async (gradeData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/grades/create-grade`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gradeData),
    });
    if (!response.ok) throw new Error('Failed to create grade configuration');
    return response.json();
  },

  // Get all grades (public)
  getAllGrades: async (academicYear) => {
    const response = await fetch(
      `${API_URL}/grades/all-grades${academicYear ? '?academicYear=' + academicYear : ''}`
    );
    if (!response.ok) throw new Error('Failed to fetch grades');
    return response.json();
  },

  // Get grade configuration (public)
  getGradeConfig: async (grade, academicYear = new Date().getFullYear().toString()) => {
    const response = await fetch(
      `${API_URL}/grades/grade-config?grade=${grade}&academicYear=${academicYear}`
    );
    if (!response.ok) throw new Error('Failed to fetch grade configuration');
    return response.json();
  },

  // Assign student to section (admin only) - auto-assign
  assignStudentToSection: async (studentId, grade, academicYear = new Date().getFullYear().toString()) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/grades/assign-student/${studentId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grade, academicYear }),
    });
    if (!response.ok) throw new Error('Failed to assign student to section');
    return response.json();
  },

  // Change student section (admin only)
  changeStudentSection: async (studentId, newSection, grade, academicYear = new Date().getFullYear().toString()) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/grades/change-student-section`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studentId, newSection, grade, academicYear }),
    });
    if (!response.ok) throw new Error('Failed to change student section');
    return response.json();
  },

  // Get section statistics (public)
  getSectionStatistics: async (grade, academicYear = new Date().getFullYear().toString()) => {

    const response = await fetch(
      `${API_URL}/grades/section-statistics?grade=${grade}&academicYear=${academicYear}`
    );
    if (!response.ok) throw new Error('Failed to fetch section statistics');
    return response.json();
  },

  // Update section name and capacity (admin only)
  updateSection: async (grade, sectionName, newSectionName, maxStudents, academicYear = new Date().getFullYear().toString()) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/grades/update-section`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grade, sectionName, newSectionName, maxStudents, academicYear }),
    });
    if (!response.ok) throw new Error('Failed to update section');
    return response.json();
  },
};

export default gradeService;
