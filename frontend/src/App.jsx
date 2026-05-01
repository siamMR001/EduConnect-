import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LogOut,
  User,
  LayoutDashboard,
  Calendar as CalendarIcon,
  Users,
  Bus,
  DollarSign,
  FileText,
  BarChart3,
  Settings,
  BookOpen,
  MapPin,
  ClipboardList,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';


// Page Imports
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
import AdminSettings from './pages/AdminSettings';
import AdminBusRoutes from './pages/AdminBusRoutes';
import BusDriverPanel from './pages/BusDriverPanel';
import BusTrackingMap from './pages/BusTrackingMap';
import BusFare from './pages/BusFare';
import AdminPayments from './pages/AdminPayments';
import AdminExpenses from './pages/AdminExpenses';
import AdminAnalytics from './pages/AdminAnalytics';
import RegistrationSuccess from './pages/RegistrationSuccess';
import StudentPayments from './pages/StudentPayments';
import SocraticTutor from './components/SocraticTutor';
import AdminProfile from './pages/AdminProfile';

const Sidebar = ({ user, isOpen, setIsOpen }) => {
  if (user?.role !== 'admin') return null;

  const adminLinks = [
    { to: "/admin/payments", icon: <DollarSign size={20} />, label: "Payments" },
    { to: "/admin/expenses", icon: <FileText size={20} />, label: "Expenses" },
    { to: "/admin/analytics", icon: <BarChart3 size={20} />, label: "Analytics" },
    { to: "/admin/settings", icon: <Settings size={20} />, label: "Settings" },
  ];

  const systemLinks = [
    { to: "/admin/teachers", icon: <Users size={20} />, label: "Teachers (TEM)" },
    { to: "/admin/students", icon: <ClipboardList size={20} />, label: "Students" },
    { to: "/admin/bus-routes", icon: <MapPin size={20} />, label: "Bus Routes" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {!isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-md animate-fade-in no-print print:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 lg:top-[73px] h-screen lg:h-[calc(100vh-73px)] z-[70] 
        transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        ${isOpen ? 'w-20' : 'w-64'} 
        bg-[#0f172a]/80 backdrop-blur-3xl border-r border-white/5 
        flex flex-col overflow-y-auto overflow-x-hidden
        ${isOpen ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        shadow-[20px_0_50px_-20px_rgba(0,0,0,0.5)]
        no-print print:hidden
      `}>
        {/* Sidebar Header for Mobile */}
        <div className="lg:hidden flex items-center justify-between p-6 border-b border-white/5 mb-4">
          <span className="text-xl font-black text-primary-light">EduConnect</span>
          <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex-1">
          <p className={`text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 ml-2 transition-all duration-300 ${isOpen ? 'opacity-0 scale-90 h-0 overflow-hidden' : 'opacity-100'}`}>
            Management
          </p>
          <div className="space-y-1.5">
            {adminLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                title={isOpen ? link.label : ""}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all duration-300 group relative ${isOpen ? 'justify-center' : ''}`}
              >
                <span className="group-hover:text-primary-light transition-colors group-hover:scale-110 duration-300">{link.icon}</span>
                {!isOpen && <span className="text-sm font-bold tracking-tight">{link.label}</span>}
                {isOpen && (
                  <div className="absolute left-full ml-4 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] whitespace-nowrap shadow-xl">
                    {link.label}
                  </div>
                )}
              </Link>
            ))}
          </div>

          <div className="mt-10">
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 ml-2 transition-all duration-300 ${isOpen ? 'opacity-0 scale-90 h-0 overflow-hidden' : 'opacity-100'}`}>
              Directory
            </p>
            <div className="space-y-1.5">
              {systemLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  title={isOpen ? link.label : ""}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all duration-300 group relative ${isOpen ? 'justify-center' : ''}`}
                >
                  <span className="group-hover:text-primary-light transition-colors group-hover:scale-110 duration-300">{link.icon}</span>
                  {!isOpen && <span className="text-sm font-bold tracking-tight">{link.label}</span>}
                  {isOpen && (
                    <div className="absolute left-full ml-4 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] whitespace-nowrap shadow-xl">
                      {link.label}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Profile Section */}
        <div className="mt-auto p-4 border-t border-white/5 bg-black/20">
          <div className={`flex items-center gap-3 p-2 rounded-2xl transition-all duration-300 ${isOpen ? 'justify-center' : 'hover:bg-white/[0.03]'}`}>
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary-dark flex items-center justify-center text-white font-black text-sm border border-white/10 shadow-lg shadow-primary/20">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#1a1a2e] rounded-full shadow-sm"></div>
            </div>
            {!isOpen && (
              <div className="animate-fade-in flex-1 overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{user?.name || 'Admin User'}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Administrator</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkLoginStatus = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
      try {
        setUser(JSON.parse(localStorage.getItem('user')));
      } catch {
        setUser(null);
      }
    };
    checkLoginStatus();
    window.addEventListener('storage', checkLoginStatus);
    const interval = setInterval(checkLoginStatus, 500);
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
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-light/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-dark/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />

      {isLoggedIn && (
        <nav className="bg-[#0f172a]/80 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-[100] h-[73px] flex items-center no-print print:hidden">
          <div className="w-full max-w-screen-2xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              {user?.role === 'admin' && (
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="hidden lg:flex p-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95 group shadow-lg"
                  title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                  {isSidebarCollapsed ? <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" /> : <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />}
                </button>
              )}
              {/* Mobile Menu Button */}
              {user?.role === 'admin' && (
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="lg:hidden p-2 text-slate-400 hover:text-white"
                >
                  <Menu size={24} />
                </button>
              )}

              <Link to="/dashboard" className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-primary-light tracking-tighter">
                EduConnect
              </Link>

              <div className="hidden xl:flex items-center gap-8 ml-4">
                <Link to="/dashboard" className="text-slate-400 hover:text-white font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5">
                  <LayoutDashboard size={18} /> Dashboard
                </Link>
                <Link to="/calendar" className="text-slate-400 hover:text-white font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5">
                  <CalendarIcon size={18} /> Calendar
                </Link>

                {user?.role === 'teacher' && (
                  <Link to='/teacher-assignments' className="text-slate-400 hover:text-white font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5">
                    <ClipboardList size={18} /> Assignments
                  </Link>
                )}

                {user?.role === 'student' && (
                  <Link to="/payments" className="text-slate-400 hover:text-white font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5">
                    <DollarSign size={18} /> Payments
                  </Link>
                )}

                {(user?.role === 'student' || user?.role === 'admin') && (
                  <Link to="/track-bus" className="text-slate-400 hover:text-white font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5">
                    <Bus size={18} /> Track Bus
                  </Link>
                )}

                {(user?.role !== 'student' && user?.role !== 'employee') && (
                  <Link to="/directory" className="text-slate-400 hover:text-white font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5">
                    <Users size={18} /> SIS
                  </Link>
                )}

                {user?.role === 'employee' && (
                  <Link to="/bus-driver" className="text-slate-400 hover:text-white font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5">
                    <Bus size={18} /> Driver Panel
                  </Link>
                )}

                {(user?.role !== 'employee') && (
                  <Link to="/classrooms" className="text-slate-400 hover:text-white font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5">
                    <BookOpen size={18} /> Classrooms
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <NotificationsPanel />
              <div className="w-px h-6 bg-white/10 hidden sm:block"></div>
              <Link to="/profile" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-[1.5px] group-hover:scale-105 transition-all">
                  <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center overflow-hidden border border-white/10">
                    <User size={18} className="text-white" />
                  </div>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl font-bold text-sm transition-all active:scale-95"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </nav>
      )}

      <div className="flex flex-1 relative z-10">
        {isLoggedIn && <Sidebar user={user} isOpen={isSidebarCollapsed} setIsOpen={setIsSidebarCollapsed} />}
        <main className="flex-1 p-4 sm:p-8 relative overflow-x-hidden transition-all duration-500 print:p-0 print:m-0 print:overflow-visible">
          <Routes>
            <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" replace />} />
            <Route path="/calendar" element={isLoggedIn ? <EventCalendar /> : <Navigate to="/login" replace />} />
            <Route path="/student-assignments" element={isLoggedIn && user?.role === 'student' ? <StudentAssignments /> : <Navigate to="/dashboard" replace />} />
            <Route path="/teacher-assignments" element={isLoggedIn && user?.role === 'teacher' ? <TeacherAssignments /> : <Navigate to="/dashboard" replace />} />
            <Route path="/apply" element={<AdmissionForm />} />
            <Route path="/registration-success" element={<RegistrationSuccess />} />
            <Route path="/profile" element={isLoggedIn ? (user?.role === 'student' ? <StudentProfile /> : user?.role === 'admin' ? <AdminProfile /> : <TeacherProfile />) : <Navigate to="/login" replace />} />
            <Route path="/profile/:id" element={isLoggedIn && (user?.role === 'admin' || user?.role === 'teacher') ? <StudentProfile /> : <Navigate to="/dashboard" replace />} />
            <Route path="/directory" element={isLoggedIn && user?.role !== 'student' ? <StudentDirectory /> : <Navigate to="/dashboard" replace />} />
            <Route path="/teacher-registration" element={<TeacherRegister />} />
            <Route path="/classrooms" element={isLoggedIn ? <Classrooms /> : <Navigate to="/login" replace />} />
            <Route path="/classrooms/:id" element={isLoggedIn ? <ClassroomView /> : <Navigate to="/login" replace />} />
            <Route path="/admin/teachers" element={isLoggedIn && user?.role === 'admin' ? <AdminTeacherDashboard /> : <Navigate to="/dashboard" replace />} />
            <Route path="/admin/students" element={isLoggedIn && user?.role === 'admin' ? <AdminStudentAssignment /> : <Navigate to="/dashboard" replace />} />
            <Route path="/admin/bus-routes" element={isLoggedIn && user?.role === 'admin' ? <AdminBusRoutes /> : <Navigate to="/dashboard" replace />} />
            <Route path="/admin/payments" element={isLoggedIn && user?.role === 'admin' ? <AdminPayments /> : <Navigate to="/dashboard" replace />} />
            <Route path="/admin/expenses" element={isLoggedIn && user?.role === 'admin' ? <AdminExpenses /> : <Navigate to="/dashboard" replace />} />
            <Route path="/admin/analytics" element={isLoggedIn && user?.role === 'admin' ? <AdminAnalytics /> : <Navigate to="/dashboard" replace />} />
            <Route path="/admin/settings" element={isLoggedIn && user?.role === 'admin' ? <AdminSettings /> : <Navigate to="/dashboard" replace />} />
            <Route path="/bus-driver" element={isLoggedIn && user?.role === 'employee' ? <BusDriverPanel /> : <Navigate to="/dashboard" replace />} />
            <Route path="/track-bus" element={isLoggedIn ? <BusTrackingMap /> : <Navigate to="/login" replace />} />
            <Route path="/payments" element={isLoggedIn && user?.role === 'student' ? <StudentPayments /> : <Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />
          </Routes>
        </main>
      </div>

      {isLoggedIn && user?.role === 'student' && <SocraticTutor />}

      <footer className="w-full py-8 px-6 border-t border-white/5 bg-[#0f172a]/80 backdrop-blur-md relative z-20 no-print print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
            <p className="text-slate-400 text-sm font-black tracking-tight">EduConnect <span className="text-slate-600 font-medium italic">| Institutional Ecosystem</span></p>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Crafted by <span className="text-primary hover:text-primary-light transition-all cursor-default">Siam, Paro, Veer</span></p>
        </div>
      </footer>
    </div>
  );
}

export default App;
