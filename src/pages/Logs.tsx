import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ScrollText, Clock, User, Hash } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

interface LogEntry {
  id: number;
  created_at: string;
  action: string;
  user: string;
  type: string;
  reference_id: number;
}

export default function Logs() {
  const { getToken } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/logs', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [getToken]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Logs</h1>
        <p className="text-slate-500">Recent events and system activity.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold w-56">Time</th>
                <th className="px-6 py-4 font-semibold w-40">User</th>
                <th className="px-6 py-4 font-semibold w-32">Type</th>
                <th className="px-6 py-4 font-semibold">Action Detail</th>
                <th className="px-6 py-4 font-semibold text-right">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log, index) => (
                <tr key={`${log.type}-${log.id}-${index}`} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500 flex items-center gap-2">
                     <Clock size={14} />
                     {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700 flex items-center gap-2">
                     <div className="w-6 h-6 bg-slate-100 text-slate-600 rounded flex items-center justify-center text-[10px] uppercase font-bold">
                        {log.user?.charAt(0) || '?'}
                     </div>
                     {log.user}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-medium uppercase tracking-wider",
                      log.type === 'Ticket' ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                    )}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 text-right">
                     {log.type === 'Ticket' || log.type === 'Message' ? (
                       <Link 
                          to={`/tickets/${log.reference_id}`}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                       >
                         <Hash size={14} /> {log.reference_id}
                       </Link>
                     ) : (
                       <span className="text-slate-400">-</span>
                     )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <ScrollText size={32} className="text-slate-300" />
                      <p>No recent activity logs found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
