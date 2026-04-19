import { useState, useEffect } from 'react';
import { ArrowRight, RotateCw } from 'lucide-react';
import gradeService from '../services/gradeService';

export default function AdminStudentAssignment() {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [academicYear] = useState('2025-2026');
  const [selectedGrade, setSelectedGrade] = useState('6');
  const [sectionStats, setSectionStats] = useState(null);
  const [assigningStudent, setAssigningStudent] = useState(null);

  const GRADES = ['6', '7', '8', '9', '10'];

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const data = await gradeService.getAllGrades(academicYear);
      setGrades(data.grades || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionStats = async (grade) => {
    try {
      const data = await gradeService.getSectionStatistics(grade, academicYear);
      setSectionStats(data.statistics);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  useEffect(() => {
    if (selectedGrade) {
      fetchSectionStats(selectedGrade);
    }
  }, [selectedGrade]);

  // Mock function - in real app, this would fetch from student API
  const fetchStudentsForGrade = async (grade) => {
    // Simulating fetching unassigned or reassignable students
    const mockStudents = [
      { _id: '1', firstName: 'Ahmed', lastName: 'Hassan', currentClass: grade, section: null, rollNumber: null },
      { _id: '2', firstName: 'Fatima', lastName: 'Khan', currentClass: grade, section: 'A', rollNumber: 5 },
      { _id: '3', firstName: 'Ali', lastName: 'Mohammed', currentClass: grade, section: null, rollNumber: null },
      { _id: '4', firstName: 'Zainab', lastName: 'Ahmed', currentClass: grade, section: 'B', rollNumber: 12 },
      { _id: '5', firstName: 'Omar', lastName: 'Salem', currentClass: grade, section: null, rollNumber: null },
    ];
    setStudents(mockStudents);
  };

  useEffect(() => {
    if (selectedGrade) {
      fetchStudentsForGrade(selectedGrade);
    }
  }, [selectedGrade]);

  const handleAutoAssign = async (studentId) => {
    try {
      setAssigningStudent(studentId);
      setError('');
      const result = await gradeService.assignStudentToSection(
        studentId,
        selectedGrade,
        academicYear
      );
      
      // Update student in list
      setStudents(
        students.map(s =>
          s._id === studentId
            ? {
                ...s,
                section: result.student.section,
                rollNumber: result.student.rollNumber,
              }
            : s
        )
      );

      // Refresh section stats
      await fetchSectionStats(selectedGrade);
    } catch (err) {
      setError(err.message);
    } finally {
      setAssigningStudent(null);
    }
  };

  const handleManualAssign = async (studentId, newSection) => {
    try {
      setAssigningStudent(studentId);
      setError('');
      const result = await gradeService.changeStudentSection(
        studentId,
        newSection,
        selectedGrade,
        academicYear
      );

      setStudents(
        students.map(s =>
          s._id === studentId
            ? {
                ...s,
                section: result.student.section,
                rollNumber: result.student.rollNumber,
              }
            : s
        )
      );

      // Refresh section stats
      await fetchSectionStats(selectedGrade);
    } catch (err) {
      setError(err.message);
    } finally {
      setAssigningStudent(null);
    }
  };

  const getAvailableSections = () => {
    const gradeConfig = grades.find(g => g.grade === selectedGrade);
    return gradeConfig?.sections?.map(s => s.sectionName) || [];
  };

  const getSectionStatus = (sectionName) => {
    const section = sectionStats?.sections?.find(s => s.sectionName === sectionName);
    if (!section) return null;
    return {
      current: section.currentStudentCount,
      max: section.maxStudents,
      isFull: section.isFull,
      percentage: Math.round((section.currentStudentCount / section.maxStudents) * 100),
    };
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Student Section Assignment</h1>
        <p className="text-slate-400">Auto-assign or manually move students to sections for {academicYear}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Class Selector */}
      <div className="mb-6 flex gap-4">
        <div>
          <label className="text-slate-400 text-sm">Select Class</label>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="mt-1 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white"
          >
            {GRADES.map(g => (
              <option key={g} value={g}>Class {g}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading data...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section Status Panel */}
          <div className="lg:col-span-1">
            <div className="glass-panel border border-white/10 rounded-lg p-6">
              <h3 className="text-white font-bold mb-4">Section Status - Class {selectedGrade}</h3>
              <div className="space-y-4">
                {getAvailableSections().map((section) => {
                  const status = getSectionStatus(section);
                  if (!status) return null;

                  return (
                    <div key={section} className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-semibold">Section {section}</h4>
                        {status.isFull && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                            FULL
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm mb-2">
                        {status.current} / {status.max} students
                      </p>
                      <div className="w-full bg-slate-700/30 rounded-full h-2">
                        <div
                          className={`h-full rounded-full transition-all ${
                            status.percentage >= 90
                              ? 'bg-red-500'
                              : status.percentage >= 70
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${status.percentage}%` }}
                        />
                      </div>
                      <p className="text-slate-400 text-xs mt-2">{status.percentage}% Full</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Students Assignment Panel */}
          <div className="lg:col-span-2">
            <div className="glass-panel border border-white/10 rounded-lg p-6">
              <h3 className="text-white font-bold mb-4">Students - Class {selectedGrade}</h3>
              {students.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No students for this class</div>
              ) : (
                <div className="space-y-3">
                  {students.map((student) => (
                    <div
                      key={student._id}
                      className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {student.firstName} {student.lastName}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-sm">
                          {student.section ? (
                            <>
                              <span className="text-slate-400">
                                Current: <span className="text-blue-400 font-semibold">Section {student.section}</span>
                              </span>
                              <span className="text-slate-400">
                                Roll: <span className="text-blue-400 font-semibold">#{student.rollNumber}</span>
                              </span>
                            </>
                          ) : (
                            <span className="text-yellow-400">Unassigned</span>
                          )}
                        </div>
                      </div>

                      {/* Auto-assign button */}
                      {!student.section && (
                        <button
                          onClick={() => handleAutoAssign(student._id)}
                          disabled={assigningStudent === student._id}
                          className="ml-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                          <RotateCw className="w-4 h-4" />
                          Auto Assign
                        </button>
                      )}

                      {/* Manual assignment dropdown */}
                      {student.section && (
                        <select
                          onChange={(e) => handleManualAssign(student._id, e.target.value)}
                          disabled={assigningStudent === student._id}
                          className="ml-2 px-3 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm cursor-pointer disabled:opacity-50"
                          defaultValue={student.section}
                        >
                          <option value="">Move to Section...</option>
                          {getAvailableSections().map((sec) => (
                            <option key={sec} value={sec}>
                              Section {sec}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="mt-8 p-6 glass-panel border border-white/10 rounded-lg bg-blue-500/5">
        <h4 className="text-white font-semibold mb-3">How It Works</h4>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span><strong>Auto Assign:</strong> System automatically places unassigned students in the first available section with space, in sequential order (A → B → C)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span><strong>Manual Move:</strong> Reassign students between sections using the dropdown. Roll numbers are recalculated automatically.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span><strong>Occupancy:</strong> View real-time section capacity on the right. Sections show red when 90%+ full.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span><strong>Academic Year:</strong> All assignments are for {academicYear}. Different years have separate configurations.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
