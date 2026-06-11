import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';

export default function TicketNew() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    category: 'IT Support',
    priority: 'Medium',
    description: ''
  });

  const categories = [
    'IT Support',
    'Network Outage',
    'Hardware Issue',
    'Software Access',
    'Facilities',
    'HR Query',
    'General Complaint'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        navigate(formData.category.includes('Complaint') ? '/complaints' : '/tickets');
      } else {
        setError(data.error || 'Failed to submit ticket');
      }
    } catch (err) {
      setError('Network connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full animate-in fade-in duration-500">
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" /> Back
        </button>
        <h1 className="text-2xl font-bold text-slate-900">New Request / Complaint</h1>
        <p className="text-slate-500 text-sm">Please provide details about your issue.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Submission Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Priority Level</label>
              <select 
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea 
              required
              rows={8}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium"
              placeholder="Please describe the issue or complaint in detail..."
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit"
              disabled={loading}
              className="bg-blue-700 text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-200 disabled:opacity-70"
            >
              {loading ? (
                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Submit Request <Send size={18} /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
