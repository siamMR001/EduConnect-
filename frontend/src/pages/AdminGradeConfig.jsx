import { useState, useEffect } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import gradeService from '../services/gradeService';

export default function AdminGradeConfig() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [academicYear] = useState(new Date().getFullYear().toString());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCapacity, setEditingCapacity] = useState({});

  const [formData, setFormData] = useState({
    grade: '6',
    maxSections: 3,
  });


  const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const data = await gradeService.getAllGrades(academicYear);
      const sorted = (data.grades || []).sort((a, b) => (parseInt(a.grade) || 0) - (parseInt(b.grade) || 0));
      setGrades(sorted);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, [academicYear]);

  const handleCreateGrade = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const result = await gradeService.createGradeConfiguration({
        grade: formData.grade,
        maxSections: parseInt(formData.maxSections),
        academicYear,
      });
      setGrades([...grades, result.gradeConfig]);
      setShowCreateForm(false);
      setFormData({ grade: '6', maxSections: 3 });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateCapacity = async (gradeId, sectionName, newCapacity) => {
    try {
      const gradeConfig = grades.find(g => g._id === gradeId);
      const result = await gradeService.updateSectionCapacity(
        gradeConfig.grade,
        sectionName,
        parseInt(newCapacity),
        academicYear
      );
      setGrades(grades.map(g => g._id === gradeId ? result.gradeConfig : g));
      setEditingCapacity({});
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const getOccupancyPercentage = (current, max) => {
    return Math.round((current / max) * 100);
  };

  const getOccupancyColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Class Configuration</h1>
        <p className="text-slate-400">Manage classes, sections, and student capacities for {academicYear}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Create New Class
        </button>
      </div>

      {/* Create Class Form */}
      {showCreateForm && (
        <div className="mb-6 p-6 glass-panel border border-white/10 rounded-lg">
          <h3 className="text-white font-bold mb-4">Create Class Configuration</h3>
          <form onSubmit={handleCreateGrade} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400 text-sm">Grade</label>
              <input
                type="text"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                placeholder="e.g. 11, Play, Nursery"
                className="mt-1 w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500"
                required
              />
            <div>
              <label className="text-slate-400 text-sm">Number of Sections</label>
              <select
                value={formData.maxSections}
                onChange={(e) => setFormData({ ...formData, maxSections: e.target.value })}
                className="mt-1 w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white"
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n} Sections ({SECTIONS.slice(0, n).join(', ')})</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="flex-1 btn-primary">Create</button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Classes List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading classes...</div>
      ) : grades.length === 0 ? (
        <div className="text-center py-12 glass-panel border border-white/10 rounded-lg">
          <p className="text-slate-400 mb-4">No classes configured yet</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            Create First Class
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {grades.map((gradeConfig) => (
            <div key={gradeConfig._id} className="glass-panel border border-white/10 rounded-lg p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white">Class {gradeConfig.grade}</h3>
                  <div className="text-right">
                    <p className="text-slate-400 text-sm">Total Enrollment</p>
                    <p className="text-2xl font-bold text-white">
                      {gradeConfig.currentEnrollment} / {gradeConfig.totalCapacity}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-slate-700/30 rounded-full h-2">
                  <div
                    className={`h-full rounded-full transition-all ${getOccupancyColor(
                      getOccupancyPercentage(gradeConfig.currentEnrollment, gradeConfig.totalCapacity)
                    )}`}
                    style={{
                      width: `${getOccupancyPercentage(
                        gradeConfig.currentEnrollment,
                        gradeConfig.totalCapacity
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-slate-300 font-semibold mb-4">Sections</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gradeConfig.sections?.map((section) => {
                    const editKey = `${gradeConfig._id}-${section.sectionName}`;
                    const isEditing = editingCapacity[editKey];

                    return (
                      <div
                        key={section.sectionName}
                        className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-white font-semibold">Section {section.sectionName}</h5>
                          {section.isFull && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                              FULL
                            </span>
                          )}
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-slate-400 text-sm">Enrollment</p>
                            <p className="text-white font-semibold">
                              {section.currentStudentCount} / {section.maxStudents}
                            </p>
                          </div>
                          <div className="w-full bg-slate-700/30 rounded-full h-2">
                            <div
                              className={`h-full rounded-full transition-all ${getOccupancyColor(
                                getOccupancyPercentage(section.currentStudentCount, section.maxStudents)
                              )}`}
                              style={{
                                width: `${getOccupancyPercentage(
                                  section.currentStudentCount,
                                  section.maxStudents
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <input
                                type="number"
                                value={editingCapacity[`${editKey}-value`] || section.maxStudents}
                                onChange={(e) =>
                                  setEditingCapacity({
                                    ...editingCapacity,
                                    [`${editKey}-value`]: e.target.value,
                                  })
                                }
                                className="flex-1 px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm"
                                min="1"
                              />
                              <button
                                onClick={() =>
                                  handleUpdateCapacity(
                                    gradeConfig._id,
                                    section.sectionName,
                                    editingCapacity[`${editKey}-value`]
                                  )
                                }
                                className="p-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() =>
                                setEditingCapacity({
                                  ...editingCapacity,
                                  [editKey]: true,
                                  [`${editKey}-value`]: section.maxStudents,
                                })
                              }
                              className="w-full px-3 py-1 text-slate-400 hover:text-white text-sm border border-slate-600/30 hover:border-slate-600/50 rounded transition-colors"
                            >
                              Edit Capacity
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
