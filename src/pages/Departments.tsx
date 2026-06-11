import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Plus, Trash2, ShieldAlert } from 'lucide-react';

interface Department {
  id: number;
  name: string;
}

export default function Departments() {
  const { getToken } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDeptName, setNewDeptName] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setDepartments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    setAddLoading(true);
    setError('');
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ name: newDeptName })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to add department');
      } else if (data.success) {
        setNewDeptName('');
        await fetchDepartments();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    
    try {
      const res = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || 'Failed to delete department');
      } else {
        await fetchDepartments();
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
          <Building2 size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold border-none text-slate-900">Departments Management</h1>
          <p className="text-slate-500 font-medium">Manage PAN departments.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
            <h2 className="font-bold text-slate-900 mb-4 flex gap-2 items-center">
              <Plus size={18} className="text-blue-600" />
              Add Department
            </h2>
            
            {error && (
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg flex items-start gap-2 text-sm border border-red-100">
                <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleAddDepartment} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Department Name</label>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm"
                  placeholder="e.g. Graphic Design"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={addLoading || !newDeptName.trim()}
                className="w-full bg-slate-900 text-white font-bold px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed justify-center flex items-center gap-2"
              >
                {addLoading ? 'Adding...' : 'Add Department'}
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Department Name</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map(dept => (
                  <tr key={dept.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900 border-none">{dept.name}</td>
                    <td className="px-6 py-4 text-right border-none">
                      <button 
                        onClick={() => handleDelete(dept.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors bg-transparent border-none p-2 rounded-lg hover:bg-red-50"
                        title="Delete Department"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {departments.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-slate-500">
                      No departments configured.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
