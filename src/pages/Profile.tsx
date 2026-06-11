import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Save, User, Shield, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Profile() {
  const { user, getToken } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (password.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user?.id}/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ newPassword: password })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Password updated successfully.');
        setPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg(data.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full max-w-2xl mx-auto w-full pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profile Settings</h1>
        <p className="text-slate-500">Manage your account and security preferences.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50 overflow-hidden">
          <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-2xl uppercase shadow-sm">
            {user?.username?.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.username}</h2>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
              <span className="flex items-center gap-1"><Shield size={14} /> {user?.role}</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1"><User size={14} /> {user?.department || 'General'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Lock size={18} /> Security Settings
          </h3>
          
          {successMsg && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
              placeholder="Confirm new password"
            />
          </div>
          
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
               {loading ? (
                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
               ) : (
                 <><Save size={16} /> Save Changes</>
               )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
