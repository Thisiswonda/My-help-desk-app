import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Plus, Edit, Trash2, Key, Search, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface UserData {
  id: number;
  username: string;
  role: string;
  department: string;
}

export default function Users() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departments, setDepartments] = useState<{ id: number, name: string }[]>([]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'staff',
    department: ''
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setDepartments(data);
        if (data.length > 0 && formData.department === '') {
          setFormData(prev => ({ ...prev, department: data[0].name }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [getToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setFormData({ username: '', password: '', role: 'staff', department: departments.length > 0 ? departments[0].name : 'General' });
        fetchUsers(); // Refresh list
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Network connection error');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 text-sm">Manage staff access and roles for the internal network.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-800 transition-colors shadow-sm focus:ring-4 focus:ring-blue-100"
        >
          <Plus size={18} />
          <span>Add User</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Add New User</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded border border-red-100 text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                <input 
                  required
                  type="text" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Temporary Password</label>
                <input 
                  required
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                <select 
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                  {departments.length === 0 && <option value="General">General</option>}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors border border-transparent"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center min-w-[100px]"
                >
                  {formLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium text-slate-900 placeholder:font-normal"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 whitespace-nowrap text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-blue-700 font-bold text-xs uppercase">
                          {u.username.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-900">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset",
                        u.role === 'Super Admin' || u.role === 'admin' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
                        u.role === 'Technician' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
                        'bg-slate-50 text-slate-700 ring-slate-600/20'
                      )}>
                        {u.role === 'admin' ? 'Super Admin' : u.role === 'staff' ? 'Staff' : u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.department || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 text-slate-400">
                        <button className="hover:text-amber-500 p-1.5 rounded-md hover:bg-slate-100 transition-colors" title="Change Password">
                          <Key size={16} />
                        </button>
                        <button className="hover:text-blue-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors" title="Edit User">
                          <Edit size={16} />
                        </button>
                        <button className="hover:text-red-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors" title="Delete User">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>
    </div>
  );
}
