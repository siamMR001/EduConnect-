import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdmissionForm from './pages/AdmissionForm';
import StudentProfile from './pages/StudentProfile';
import NoticeBoard from './pages/NoticeBoard';
import EventCalendar from './pages/EventCalendar';
import NotificationsPanel from './components/NotificationsPanel';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    // Check login state on mount and listen for storage changes
    const checkLoginStatus = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
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
          <nav className="bg-white shadow-lg border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Link to="/dashboard" className="text-2xl font-bold text-blue-600">
                  EduConnect
                </Link>
                <div className="hidden md:flex items-center gap-6">
                  <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium transition">
                    Dashboard
                  </Link>
                  <Link to="/notices" className="text-gray-700 hover:text-blue-600 font-medium transition">
                    Notices
                  </Link>
                  <Link to="/calendar" className="text-gray-700 hover:text-blue-600 font-medium transition">
                    Calendar
                  </Link>
                  <Link to="/profile" className="text-gray-700 hover:text-blue-600 font-medium transition">
                    Profile
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <NotificationsPanel />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </nav>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 w-full">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" replace />} />
            <Route path="/notices" element={isLoggedIn ? <NoticeBoard /> : <Navigate to="/login" replace />} />
            <Route path="/calendar" element={isLoggedIn ? <EventCalendar /> : <Navigate to="/login" replace />} />
            <Route path="/apply" element={<AdmissionForm />} />
            <Route path="/profile" element={isLoggedIn ? <StudentProfile /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
