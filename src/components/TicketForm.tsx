import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface TicketFormProps {
  onSuccess?: () => void;
}

export function TicketForm({ onSuccess }: TicketFormProps) {
  const [formData, setFormData] = useState({
    description: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');
    
    const token = localStorage.getItem('helpdesk_token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...formData, priority: 'Low' })
      });
      
      const result = await res.json();

      if (res.ok) {
        setStatus('success');
        setFormData({ description: '' });
        if (onSuccess) setTimeout(onSuccess, 1500);
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Server rejected the request');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Connection error.');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-xl text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-green-50 rounded-full">
            <CheckCircle2 size={64} className="text-green-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-4">Ticket Submitted</h2>
        <p className="text-slate-500 mb-8 font-medium">Your request has been logged. Our IT staff will review it shortly. Reference ID will be generated in your dashboard.</p>
        <button 
          onClick={() => setStatus('idle')}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95"
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 space-y-8">
          <div className="space-y-6">
          <div className="space-y-2">
            <label className="block font-bold text-[10px] uppercase tracking-widest text-slate-400 ml-1">Incident Registry</label>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
               <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Protocol Verification Active</p>
               <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-75" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse delay-150" />
               </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block font-bold text-[10px] uppercase tracking-widest text-slate-400 ml-1">Incident Details</label>
            <textarea
              required
              rows={6}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium leading-relaxed transition-all"
              placeholder="Please provide a clear description of the issue..."
            />
          </div>
        </div>

        {status === 'error' && (
          <div className="flex items-center gap-3 text-red-600 font-bold text-[10px] uppercase bg-red-50 p-4 rounded-xl border border-red-100">
            <AlertCircle size={14} className="shrink-0" />
            <div>
              <p>Submission Failed</p>
              <p className="text-[9px] opacity-70 mt-0.5 normal-case">{errorMessage}</p>
            </div>
          </div>
        )}

        <button
          disabled={status === 'submitting'}
          type="submit"
          className="w-full bg-slate-900 text-white py-5 rounded-2xl flex items-center justify-center gap-3 group disabled:opacity-50 shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98]"
        >
          <span className="font-bold uppercase tracking-[0.2em]">
            {status === 'submitting' ? 'TRANSMITTING...' : 'SEND TICKET'}
          </span>
          <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </button>
      </form>
    </div>
  );
}
