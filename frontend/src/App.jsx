import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdmissionForm from './pages/AdmissionForm';
import StudentProfile from './pages/StudentProfile';
import EventCalendar from './pages/EventCalendar';
import NotificationsPanel from './components/NotificationsPanel';
import StudentDirectory from './pages/StudentDirectory';
import StudentAssignments from './pages/StudentAssignments';
import TeacherAssignments from './pages/TeacherAssignments';
import AdminTeacherDashboard from './pages/AdminTeacherDashboard';
import TeacherRegister from './pages/TeacherRegister';
import AdminStudentAssignment from './pages/AdminStudentAssignment';
import TeacherProfile from './pages/TeacherProfile';
import Classrooms from './pages/Classrooms';
import ClassroomView from './pages/ClassroomView';
import Gradesheet from './pages/Gradesheet';
import AdminSettings from './pages/AdminSettings';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  useEffect(() => {
    // Check login state on mount and listen for storage changes
    const checkLoginStatus = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
      try {
        setUser(JSON.parse(localStorage.getItem('user')));
      } catch {
        setUser(null);
      }
    };

    // Check on component mount
    checkLoginStatus();

    // Listen for storage changes (in case of login from another tab)
    window.addEventListener('storage', checkLoginStatus);

    // Also check periodically to catch local storage changes
    const interval = setInterval(checkLoginStatus, 100);

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-light/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-dark/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full h-full flex flex-col min-h-screen">
        {/* Header Navigation */}
        {isLoggedIn && (
          <nav className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Link to="/dashboard" className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  EduConnect
                </Link>
                <div className="hidden md:flex items-center gap-6">
                  <Link to="/dashboard" className="text-slate-300 hover:text-white font-medium transition-colors">
                    Dashboard
                  </Link>
                  <Link to="/calendar" className="text-slate-300 hover:text-white font-medium transition-colors">
                    Calendar
                  </Link>
                  {user?.role === 'teacher' && (
                    <Link to='/teacher-assignments' className="text-slate-300 hover:text-white font-medium transition-colors">
                      Assignments
                    </Link>
                  )}

                  {user?.role !== 'student' && (
                    <Link to="/directory" className="text-slate-300 hover:text-white font-medium transition-colors">
                      SIS
                    </Link>
                  )}

                  {user?.role === 'admin' && (
                    <>
                      <Link to="/admin/teachers" className="text-slate-300 hover:text-white font-medium transition-colors">
                        TEM
                      </Link>
                      <Link to="/admin/students" className="text-slate-300 hover:text-white font-medium transition-colors">
                        Students
                      </Link>
                      <Link to="/admin/settings" className="text-slate-300 hover:text-white font-medium transition-colors">
                        Settings
                      </Link>
                    </>
                  )}
                  <Link to="/classrooms" className="text-slate-300 hover:text-white font-medium transition-colors">
                    Classrooms
                  </Link>
                  <Link to="/gradesheet" className="text-slate-300 hover:text-white font-medium transition-colors">
                    Gradesheet
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <NotificationsPanel />
                
                <Link 
                  to="/profile" 
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 border border-white/20 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all group relative"
                  title="View Profile"
                >
                  <User className="text-white w-5 h-5 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-[#1a1a2e] rounded-full"></div>
                </Link>

                <div className="w-px h-8 bg-white/10 hidden sm:block mx-1"></div>

                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center sm:justify-start gap-2 p-2 sm:px-4 sm:py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg font-semibold transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:block">Logout</span>
                </button>
              </div>
            </div>
          </nav>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 w-full relative">
          <Routes>
            <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" replace />} />
            <Route path="/calendar" element={isLoggedIn ? <EventCalendar /> : <Navigate to="/login" replace />} />
            <Route path="/student-assignments" element={isLoggedIn && user?.role === 'student' ? <StudentAssignments /> : <Navigate to="/dashboard" replace />} />
            <Route path="/teacher-assignments" element={isLoggedIn && user?.role === 'teacher' ? <TeacherAssignments /> : <Navigate to="/dashboard" replace />} />
            <Route path="/apply" element={<AdmissionForm />} />
            <Route path="/profile" element={
              isLoggedIn ? (
                user?.role === 'student' ? <StudentProfile /> : <TeacherProfile />
              ) : (
                <Navigate to="/login" replace />
              )
            } />
            <Route path="/profile/:id" element={
              isLoggedIn ? (
                (user?.role === 'admin' || user?.role === 'teacher') ? (
                   // If admin or teacher clicks profile/:id, we show StudentProfile
                   <StudentProfile />
                ) : <Navigate to="/dashboard" replace />
              ) : <Navigate to="/login" replace />
            } />
            <Route path="/directory" element={isLoggedIn && user?.role !== 'student' ? <StudentDirectory /> : <Navigate to="/dashboard" replace />} />
            <Route path="/teacher-registration" element={<TeacherRegister />} />
            <Route path="/classrooms" element={isLoggedIn ? <Classrooms /> : <Navigate to="/login" replace />} />
            <Route path="/classrooms/:id" element={isLoggedIn ? <ClassroomView /> : <Navigate to="/login" replace />} />
            <Route path="/gradesheet" element={isLoggedIn ? <Gradesheet /> : <Navigate to="/login" replace />} />
            <Route path="/admin/teachers" element={isLoggedIn && user?.role === 'admin' ? <AdminTeacherDashboard /> : <Navigate to="/dashboard" replace />} />
            <Route path="/admin/students" element={isLoggedIn && user?.role === 'admin' ? <AdminStudentAssignment /> : <Navigate to="/dashboard" replace />} />
            <Route path="/admin/settings" element={isLoggedIn && user?.role === 'admin' ? <AdminSettings /> : <Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />
          </Routes>
        </main>

        {/* Global Footer Credits */}
        <footer className="w-full py-8 px-6 border-t border-white/5 bg-black/10 backdrop-blur-md">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-1 h-4 bg-primary rounded-full"></div>
                 <p className="text-slate-400 text-sm font-bold tracking-tight">
                    EduConnect <span className="text-slate-600 font-medium">| Institutional System</span>
                 </p>
              </div>
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em]">
                 Crafted with passion by <span className="text-primary hover:text-primary-light transition-colors cursor-default">Siam, Paro, Veer</span>
              </p>
              <div className="text-slate-600 text-[10px] font-medium uppercase tracking-widest">
                 © 2026 EDUCONNECT. ALL RIGHTS RESERVED.
              </div>
           </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
