const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5001/api';

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
  getGradeConfig: async (grade, academicYear = '2025-2026') => {
    const response = await fetch(
      `${API_URL}/grades/grade-config?grade=${grade}&academicYear=${academicYear}`
    );
    if (!response.ok) throw new Error('Failed to fetch grade configuration');
    return response.json();
  },

  // Assign student to section (admin only) - auto-assign
  assignStudentToSection: async (studentId, grade, academicYear = '2025-2026') => {
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
  changeStudentSection: async (studentId, newSection, grade, academicYear = '2025-2026') => {
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
  getSectionStatistics: async (grade, academicYear = '2025-2026') => {
    const response = await fetch(
      `${API_URL}/grades/section-statistics?grade=${grade}&academicYear=${academicYear}`
    );
    if (!response.ok) throw new Error('Failed to fetch section statistics');
    return response.json();
  },

  // Update section capacity (admin only)
  updateSectionCapacity: async (grade, sectionName, maxStudents, academicYear = '2025-2026') => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/grades/update-section-capacity`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grade, sectionName, maxStudents, academicYear }),
    });
    if (!response.ok) throw new Error('Failed to update section capacity');
    return response.json();
  },
};

export default gradeService;
