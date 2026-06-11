import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TicketForm } from './TicketForm';
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Send,
  History,
  Layout
} from 'lucide-react';

interface Ticket {
  id: number;
  department: string;
  description: string;
  priority: 'Low' | 'Medium' | 'Critical';
  status: 'Open' | 'Resolved' | 'Closed';
  created_at: string;
  resolved_at: string | null;
}

interface Message {
  id: number;
  ticket_id: number;
  user_id: number | null;
  sender_name: string | null;
  text: string;
  type: 'Direct' | 'Broadcast';
  created_at: string;
}

interface User {
  username: string;
  role: string;
  department: string | null;
}

export function StaffDashboard({ user }: { user?: User }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [broadcasts, setBroadcasts] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewingTicketId, setViewingTicketId] = useState<number | null>(null);
  const [ticketMessages, setTicketMessages] = useState<Message[]>([]);

  const fetchMyData = async () => {
    try {
      const token = localStorage.getItem('helpdesk_token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [ticketsRes, broadcastRes] = await Promise.all([
        fetch('/api/my-tickets', { headers }),
        fetch('/api/messages/broadcast', { headers })
      ]);

      const [ticketsData, broadcastData] = await Promise.all([
        ticketsRes.json(),
        broadcastRes.json()
      ]);

      if (Array.isArray(ticketsData)) setTickets(ticketsData);
      if (Array.isArray(broadcastData)) setBroadcasts(broadcastData);
    } catch (err) {
      console.error('Data fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketMessages = async (id: number) => {
    try {
      const token = localStorage.getItem('helpdesk_token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/messages/ticket/${id}`, { headers });
      const data = await res.json();
      if (Array.isArray(data)) setTicketMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (ticketId: number, text: string) => {
    if (!text.trim()) return;
    try {
      const token = localStorage.getItem('helpdesk_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ticket_id: ticketId, text, type: 'Direct' })
      });

      if (res.ok) {
        fetchTicketMessages(ticketId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (id: number, status: 'Open' | 'Resolved' | 'Closed') => {
    try {
      const token = localStorage.getItem('helpdesk_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/tickets/' + id + '/status', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status })
      });
      fetchMyData();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMyData();
    const interval = setInterval(fetchMyData, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (viewingTicketId) fetchTicketMessages(viewingTicketId);
  }, [viewingTicketId]);

  if (loading) {
    return <div className="py-20 text-center font-black text-[10px] uppercase tracking-widest text-slate-400 animate-pulse">Syncing System Link...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Broadcast Feed */}
      <AnimatePresence>
        {broadcasts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
               <Activity size={48} className="text-blue-400" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">System_Broadcast_Live</h3>
              </div>
              <div className="space-y-4">
                {broadcasts.map((msg) => (
                  <div key={msg.id} className="flex gap-4 items-start pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    <div className="text-[9px] font-black text-slate-500 uppercase tabular-nums pt-1 shrink-0">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
               <Layout size={24} className="text-blue-700" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Operations Portal</h2>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enterprise Support Interface</p>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">CONNECTED</p>
              </div>
            </div>
          </div>
          
          {user && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{user.username}</p>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {user.role === 'admin' ? 'System Administrator' : 'Department Staff'}
              </p>
              <div className="px-2 py-1 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">
                {user.department || 'General'}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => setShowForm(!showForm)}
          className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${
            showForm 
              ? 'bg-slate-100 text-slate-500 shadow-slate-100 border border-slate-200' 
              : 'bg-blue-600 text-white shadow-blue-100'
          }`}
        >
          {showForm ? 'Cancel Request' : <><Plus size={18} /> Open Ticket</>}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <TicketForm onSuccess={() => { setShowForm(false); fetchMyData(); }} />
          </motion.div>
        ) : (
          <motion.div 
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* My Ticket History */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <History className="text-slate-400" size={16} />
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Personnel Incident Ledger</h3>
              </div>

              {tickets.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl py-20 text-center">
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No active cases on file.</p>
                   <p className="text-[10px] text-slate-400 mt-2">Submit a ticket above to begin.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div 
                      key={ticket.id}
                      onClick={() => setViewingTicketId(ticket.id === viewingTicketId ? null : ticket.id)}
                      className={`bg-white border p-6 rounded-3xl cursor-pointer transition-all ${
                        viewingTicketId === ticket.id 
                        ? 'border-blue-600 shadow-xl shadow-blue-50 ring-1 ring-blue-100' 
                        : ticket.status === 'Resolved'
                        ? 'border-amber-400 bg-amber-50/30 shadow-md shadow-amber-100'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            ticket.status === 'Open' ? 'bg-blue-50 text-blue-600' : 
                            ticket.status === 'Resolved' ? 'bg-amber-100 text-amber-600' :
                            'bg-green-50 text-green-600'
                          }`}>
                            {ticket.status === 'Open' ? <Clock size={20} /> : 
                             ticket.status === 'Resolved' ? <AlertCircle size={20} /> : 
                             <CheckCircle2 size={20} />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 group-hover:text-blue-600">{ticket.department} Issue</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">REF# {ticket.id} • {new Date(ticket.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          ticket.status === 'Open' ? 'bg-blue-100 text-blue-700' : 
                          ticket.status === 'Resolved' ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-500 ring-offset-2 animate-pulse' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {ticket.status}
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 font-medium line-clamp-2 leading-relaxed">
                        {ticket.description}
                      </p>

                      {viewingTicketId === ticket.id && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-6 pt-6 border-t border-slate-100 space-y-6"
                        >
                          <div>
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                               <MessageSquare size={12} /> Directorate Transmissions
                             </h4>
                             <div className="space-y-3">
                                {ticketMessages.length === 0 ? (
                                  <div className="bg-slate-50 p-6 rounded-2xl text-[10px] font-bold text-slate-400 uppercase text-center border border-slate-100">
                                    Awaiting initial response from support team.
                                  </div>
                                ) : (
                                  ticketMessages.map((msg) => (
                                    <div key={msg.id} className={`p-4 rounded-2xl border-l-4 ${msg.sender_name === 'admin' ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-blue-600'}`}>
                                       <div className="flex justify-between items-start mb-1">
                                          <p className={`text-[10px] font-black uppercase tracking-widest ${msg.sender_name === 'admin' ? 'text-slate-500' : 'text-blue-700'}`}>
                                            {msg.sender_name === 'admin' ? 'PAN_DIRECTORATE' : 'OPERATOR_SELF'}
                                          </p>
                                          <p className="text-[9px] font-bold text-slate-500 tabular-nums">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                       </div>
                                       <p className={`${msg.sender_name === 'admin' ? 'text-slate-700' : 'text-white'} text-xs font-medium leading-relaxed`}>
                                         {msg.text}
                                       </p>
                                    </div>
                                  ))
                                )}
                             </div>

                             {ticket.status !== 'Closed' && (
                               <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                                  <input 
                                    id={`msg-input-${ticket.id}`}
                                    placeholder="Reply to IT support..."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const input = e.target as HTMLInputElement;
                                        handleSendMessage(ticket.id, input.value);
                                        input.value = '';
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      const input = document.getElementById(`msg-input-${ticket.id}`) as HTMLInputElement;
                                      handleSendMessage(ticket.id, input.value);
                                      input.value = '';
                                    }}
                                    className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 transition-all"
                                  >
                                    <Send size={16} />
                                  </button>
                               </div>
                             )}

                             {ticket.status === 'Resolved' && (
                               <div className="mt-8 p-8 bg-blue-600 rounded-[2.5rem] flex flex-col items-center text-center shadow-2xl shadow-blue-200 border-4 border-blue-400" onClick={(e) => e.stopPropagation()}>
                                 <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                                   <CheckCircle2 size={32} className="text-white" />
                                 </div>
                                 <h5 className="text-xl font-black text-white uppercase tracking-tight mb-2">Technical Resolution Verified?</h5>
                                 <p className="text-sm text-blue-100 font-medium mb-8 leading-relaxed max-w-[280px]">The technical department has marked this incident as resolved. Please confirm the solution is functional to finalize the transmission.</p>
                                 <button 
                                   onClick={() => handleStatusUpdate(ticket.id, 'Closed')}
                                   className="w-full py-5 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                 >
                                   <CheckCircle2 size={16} /> Finalize & Close Incident
                                 </button>
                               </div>
                             )}

                             {ticket.status === 'Closed' && (
                               <div className="mt-6 p-6 bg-slate-900 border border-slate-800 rounded-3xl flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                                 <div className="p-3 bg-green-500/20 text-green-400 rounded-xl">
                                   <CheckCircle2 size={24} />
                                 </div>
                                 <div className="text-left">
                                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Incident_Status</p>
                                   <p className="text-sm font-black text-white uppercase tracking-tight">Closed & Verified</p>
                                 </div>
                               </div>
                             )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Tips/Status */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-100">
                 <AlertCircle className="mb-4 text-white/80" size={32} />
                 <h4 className="text-xl font-black mb-2 tracking-tight">Need Urgent Help?</h4>
                 <p className="text-blue-100 text-sm font-medium leading-relaxed mb-6">If your incident is mission-critical, please indicate "Critical" priority during submission for accelerated response.</p>
                 <div className="bg-white/20 p-4 rounded-xl backdrop-blur-md">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white mb-2">Protocol 4-A</p>
                    <p className="text-[11px] font-bold text-blue-50 leading-snug">Average Network Response: 12.4 minutes</p>
                 </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Operations Performance</h4>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-bold text-slate-600">Total Requests</span>
                       <span className="text-xs font-black text-slate-900">{tickets.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-bold text-slate-600">Active Monitoring</span>
                       <span className="text-xs font-black text-blue-600">{tickets.filter(t => t.status === 'Open').length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-bold text-slate-600">Resolved Cases</span>
                       <span className="text-xs font-black text-green-600">{tickets.filter(t => t.status === 'Closed').length}</span>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
