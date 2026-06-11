import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CompanyLogo } from '../components/CompanyLogo';
import { 
  LayoutDashboard, 
  Ticket, 
  AlertCircle, 
  Building2, 
  BarChart3, 
  Users, 
  ScrollText, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function DashboardLayout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) setNotifications(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [getToken]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch(e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setNotificationsOpen(false);
    } catch(e) {}
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/tickets", label: "Tickets", icon: <Ticket size={18} /> },
  ];

  if (isAdmin) {
    navItems.push(
      { to: "/departments", label: "Departments", icon: <Building2 size={18} /> },
      { to: "/reports", label: "Reports", icon: <BarChart3 size={18} /> },
      { to: "/users", label: "Users", icon: <Users size={18} /> },
      { to: "/logs", label: "Logs", icon: <ScrollText size={18} /> },
      { to: "/settings", label: "Settings", icon: <Settings size={18} /> }
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <button 
                className="lg:hidden p-2 text-slate-500 hover:text-slate-900 focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              <div className="flex items-center gap-3 hidden sm:flex">
                <CompanyLogo height={36} width={80} />
                <div className="flex flex-col justify-center">
                  <span className="font-bold text-slate-900 leading-tight">Help Desk</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Internal Network</span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 lg:space-x-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-blue-50 text-blue-700" 
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Global Search */}
              <div className="hidden md:flex relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search tickets..." 
                  className="pl-9 pr-4 py-2 w-64 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>
  
                <AnimatePresence>
                  {notificationsOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)}></div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col"
                      >
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                          <p className="text-sm font-semibold text-slate-900">Notifications</p>
                          {unreadCount > 0 && (
                            <button 
                              onClick={handleMarkAllRead}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-4 text-center text-slate-500 text-sm">
                              No notifications yet.
                            </div>
                          ) : (
                            <div className="divide-y divide-slate-100">
                              {notifications.map((notif: any) => (
                                <div 
                                  key={notif.id} 
                                  className={cn(
                                    "p-4 flex flex-col gap-1 transition-colors cursor-pointer hover:bg-slate-50",
                                    !notif.is_read ? "bg-blue-50/50" : ""
                                  )}
                                  onClick={() => handleMarkAsRead(notif.id)}
                                >
                                  <div className="flex justify-between items-start gap-2">
                                    <h4 className={cn("text-sm", !notif.is_read ? "font-semibold text-slate-900" : "font-medium text-slate-700")}>
                                      {notif.title}
                                    </h4>
                                    {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                                  </div>
                                  <p className="text-xs text-slate-600">
                                    {notif.message}
                                  </p>
                                  <span className="text-[10px] text-slate-400 mt-1">
                                    {new Date(notif.created_at).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2 pr-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-full transition-colors"
                >
                  <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                    {user?.username?.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.username}</span>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}></div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                          <p className="text-sm font-semibold text-slate-900">{user?.username}</p>
                          <p className="text-xs text-slate-500 truncate">{user?.role}</p>
                        </div>
                        <div className="p-1">
                          <Link 
                            to="/profile"
                            onClick={() => setProfileOpen(false)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Settings size={16} />
                            Profile Settings
                          </Link>
                          <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <LogOut size={16} />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-slate-200 bg-white px-2 py-3 space-y-1 overflow-hidden"
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-blue-50 text-blue-700" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col h-full">
        <Outlet />
      </main>
    </div>
  );
}
