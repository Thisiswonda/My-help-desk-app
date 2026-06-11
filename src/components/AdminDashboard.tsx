import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, RotateCcw, Clock, CheckCircle, Circle, AlertTriangle, User, UserPlus, Hash, ChevronUp, ChevronDown, CheckSquare, Square, Trash2, ShieldAlert, X, Calendar, Activity, MessageSquare, Eye, EyeOff, Download } from 'lucide-react';

interface Ticket {
  id: number;
  staff_name: string;
  department: string;
  description: string;
  priority: 'Low' | 'Medium' | 'Critical';
  status: 'Open' | 'Resolved' | 'Closed';
  created_at: string;
  resolved_at: string | null;
  resolution_time_minutes: number | null;
}

interface Message {
  id: number;
  ticket_id: number | null;
  user_id: number | null;
  sender_name: string | null;
  text: string;
  type: 'Direct' | 'Broadcast';
  created_at: string;
}

interface IUser {
  id: number;
  username: string;
  role: string;
  department: string | null;
}

type SortKey = 'staff_name' | 'department' | 'description' | 'created_at' | 'resolution_time_minutes' | 'resolved_at' | 'id' | 'status' | 'priority';

export function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [activeTab, setActiveTab] = useState<'tickets' | 'users'>('tickets');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'Resolved' | 'Closed'>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'Low' | 'Medium' | 'Critical'>('All');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<Message[]>([]);
  const [globalMessage, setGlobalMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [resettingPasswordId, setResettingPasswordId] = useState<number | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<number | null>(null);
  
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDept, setRegDept] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState<'staff' | 'admin'>('staff');

  const fetchTickets = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem('helpdesk_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/tickets', { headers });
      const data = await res.json();
      
      if (!res.ok) {
        setErrorMsg(data.error || 'Identity verification failed. Please login again.');
        setTickets([]);
        return;
      }

      if (Array.isArray(data)) {
        setTickets(data);
      } else {
        setTickets([]);
        setErrorMsg('Data format error received from server.');
      }
      setSelectedIds([]); 
    } catch (err: any) {
      console.error(err);
      if (!isSilent) setErrorMsg(err.message || 'Network disruption detected while fetching records.');
      setTickets([]);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('helpdesk_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/users', { headers });
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async () => {
    if (!regUsername.trim() || !regPassword.trim()) return;
    try {
      const token = localStorage.getItem('helpdesk_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({ username: regUsername, password: regPassword, role: regRole, department: regDept })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert('New personnel registered successfully');
        setShowRegisterModal(false);
        setRegUsername('');
        setRegPassword('');
        setRegDept('');
        setRegRole('staff');
        fetchUsers();
      } else {
        alert('Registration Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (userId: number) => {
    if (!newPasswordVal.trim()) return;
    try {
      const token = localStorage.getItem('helpdesk_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/users/${userId}/password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ newPassword: newPasswordVal })
      });
      
      if (res.ok) {
        alert('Password updated successfully');
        setResettingPasswordId(null);
        setNewPasswordVal('');
      } else {
        const data = await res.json();
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (ticketId: number) => {
    try {
      const token = localStorage.getItem('helpdesk_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/messages/ticket/${ticketId}`, { headers });
      const data = await res.json();
      if (Array.isArray(data)) setTicketMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendDirect = async (ticketId: number, text: string) => {
    if (!text.trim()) return;
    try {
      const token = localStorage.getItem('helpdesk_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ticket_id: ticketId, text, type: 'Direct' })
      });
      fetchMessages(ticketId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBroadcast = async () => {
    if (!globalMessage.trim()) return;
    setIsBroadcasting(true);
    try {
      const token = localStorage.getItem('helpdesk_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: globalMessage, type: 'Broadcast' })
      });
      setGlobalMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  useEffect(() => {
    if (viewingTicket) {
      const updated = tickets.find(t => t.id === viewingTicket.id);
      if (updated && (
        updated.status !== viewingTicket.status || 
        updated.priority !== viewingTicket.priority || 
        updated.resolved_at !== viewingTicket.resolved_at
      )) {
        setViewingTicket(updated);
      }
      fetchMessages(viewingTicket.id);
    } else {
      setTicketMessages([]);
    }
  }, [tickets, viewingTicket]);

  useEffect(() => {
    fetchTickets();
    fetchUsers();
  }, []);

  const setPriority = async (id: number, priority: 'Low' | 'Medium' | 'Critical') => {
    try {
      const token = localStorage.getItem('helpdesk_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/tickets/' + id + '/priority', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ priority })
      });
      fetchTickets(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePriorityChange = async (id: number, currentPriority: string) => {
    const priorities: ('Low' | 'Medium' | 'Critical')[] = ['Low', 'Medium', 'Critical'];
    const currentIndex = priorities.indexOf(currentPriority as any);
    const nextPriority = priorities[(currentIndex + 1) % priorities.length];
    setPriority(id, nextPriority);
  };

  const handleExportCSV = () => {
    if (processedTickets.length === 0) {
      alert('No data available for export (Empty manifest).');
      return;
    }
    
    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      let s = String(val);
      if (s.includes('"')) s = s.replace(/"/g, '""');
      if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        s = `"${s}"`;
      }
      return s;
    };

    const headers = ['RECORD_ID', 'OPERATIVE', 'DIVISION', 'MANIFEST_DESCRIPTION', 'PRIORITY_LEVEL', 'CLEARANCE_STATUS', 'INITIAL_TRANSMISSION', 'FINAL_RESOLUTION', 'RECOVERY_VELOCITY_MIN'];
    
    const rows = processedTickets.map(t => [
      escapeCSV(`#${String(t.id).padStart(4, '0')}`),
      escapeCSV(t.staff_name),
      escapeCSV(t.department),
      escapeCSV(t.description),
      escapeCSV(t.priority),
      escapeCSV(t.status),
      escapeCSV(new Date(t.created_at).toLocaleString()),
      escapeCSV(t.resolved_at ? new Date(t.resolved_at).toLocaleString() : 'N/A'),
      escapeCSV(t.resolution_time_minutes || 0)
    ]);
    
    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `incident_manifest_delta_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkStatus = async (status: 'Resolved') => {
    try {
      const token = localStorage.getItem('helpdesk_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/tickets/bulk/status', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ ids: selectedIds, status })
      });
      if (res.ok) {
        fetchTickets();
      } else {
        const data = await res.json();
        alert('Bulk Action Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Communication failure during bulk operation.');
    }
  };

  const handleBulkPriority = async (priority: 'Low' | 'Medium' | 'Critical') => {
    try {
      const token = localStorage.getItem('helpdesk_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/tickets/bulk/priority', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ ids: selectedIds, priority })
      });
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTicket = (id: number) => {
    setTicketToDelete(id);
  };

  const confirmDeleteTicket = async () => {
    if (!ticketToDelete) return;
    const id = ticketToDelete;
    setTicketToDelete(null);
    
    try {
      const token = localStorage.getItem('helpdesk_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`/api/tickets/${id}`, { 
        method: 'DELETE', 
        headers 
      });
      
      if (res.ok) {
        if (viewingTicket?.id === id) setViewingTicket(null);
        await fetchTickets(true);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`ACCESS CONTROL ALERT: Deletion request rejected. ${data.error || 'Check authorization levels.'}`);
      }
    } catch (err: any) {
      console.error('CRITICAL: Delete operation transmission failed', err);
      alert('NETWORK ESCALATION: Operation timed out or sync failed. ' + err.message);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to remove this personnel from the directory?')) return;
    try {
      const token = localStorage.getItem('helpdesk_token');
      const headers: any = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const setTicketStatus = async (id: number, status: 'Open' | 'Resolved' | 'Closed') => {
    try {
      const token = localStorage.getItem('helpdesk_token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/tickets/' + id + '/status', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Immediate UI feedback for current viewing ticket
        if (viewingTicket?.id === id) {
          setViewingTicket(prev => prev ? { ...prev, status } : null);
        }
        await fetchTickets(true);
      } else {
        alert('Transmission Error: ' + (data.error || 'Unknown failure'));
      }
    } catch (err) {
      console.error(err);
      alert('Communication disruption. Please check network status.');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === processedTickets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(processedTickets.map(t => t.id));
    }
  };

  const toggleSelect = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Don't open the modal when clicking the checkbox
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedTickets = useMemo(() => {
    if (!Array.isArray(tickets)) return [];

    let result = tickets.filter(t => {
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
      
      return matchesStatus && matchesPriority;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        let valA: any = a[sortConfig.key];
        let valB: any = b[sortConfig.key];

        // Custom sort for priority
        if (sortConfig.key === 'priority') {
          const priorityOrder = { 'Critical': 3, 'Medium': 2, 'Low': 1 };
          valA = priorityOrder[valA as 'Critical' | 'Medium' | 'Low'];
          valB = priorityOrder[valB as 'Critical' | 'Medium' | 'Low'];
        }

        if (valA === null) return 1;
        if (valB === null) return -1;
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [tickets, statusFilter, priorityFilter, sortConfig]);

  const getPriorityStyle = (p: string) => {
    switch (p) {
      case 'Critical': return 'text-red-700 bg-red-50 border-red-100';
      case 'Medium': return 'text-amber-700 bg-amber-50 border-amber-100';
      default: return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig?.key !== column) return <div className="w-3 h-3 opacity-0 group-hover/header:opacity-40"><ChevronUp size={12} /></div>;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  return (
    <div className="space-y-8 min-h-0 flex flex-col relative px-4 lg:px-10 py-10 max-w-[1600px] mx-auto">
      {/* Registration Modal */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRegisterModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-8"
            >
              <h3 className="text-xl font-black mb-4 tracking-tight">Register New Personnel</h3>
              <p className="text-xs text-slate-500 mb-6 font-medium">Create credentials for new staff members or administrators.</p>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">ID_NAME</label>
                  <input 
                    type="text"
                    placeholder="Enter unique username..."
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">SECURE_PASS</label>
                  <div className="relative">
                    <input 
                      type={showRegPassword ? "text" : "password"}
                      placeholder="Enter secure password..."
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                    >
                      {showRegPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">CLEARANCE_LEVEL</label>
                  <div className="flex gap-2">
                    {(['staff', 'admin'] as const).map(role => (
                      <button
                        key={role}
                        onClick={() => setRegRole(role)}
                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${
                          regRole === role ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-4 ring-blue-50' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-white'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">DEPARTMENT</label>
                  <input 
                    type="text"
                    placeholder="e.g. Accounts, Operations..."
                    value={regDept}
                    onChange={(e) => setRegDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={handleRegister}
                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all"
                  >
                    Authorize Account
                  </button>
                  <button 
                    onClick={() => setShowRegisterModal(false)}
                    className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {ticketToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTicketToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[2rem] shadow-2xl border border-slate-200 p-8 max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="text-red-500" size={32} />
              </div>
              <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight mb-2">Confirm Erasure</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8">
                You are about to permanently wipe <span className="font-black text-slate-900">INCIDENT #{String(ticketToDelete).padStart(4, '0')}</span> from the central database. This action is terminal and irreversible.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setTicketToDelete(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Abort
                </button>
                <button 
                  onClick={confirmDeleteTicket}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  Erase Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <div className="flex flex-col gap-8">
      {/* Password Reset Modal */}
      <AnimatePresence>
        {resettingPasswordId !== null && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResettingPasswordId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-8"
            >
              <h3 className="text-xl font-black mb-4 tracking-tight">Reset User Password</h3>
              <p className="text-xs text-slate-500 mb-6 font-medium">Entering a new password for: <span className="text-slate-900 font-bold">{users.find(u => u.id === resettingPasswordId)?.username}</span></p>
              
              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type={showResetPassword ? "text" : "password"}
                    placeholder="Enter new secure password..."
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showResetPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleResetPassword(resettingPasswordId)}
                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all"
                  >
                    Confirm Reset
                  </button>
                  <button 
                    onClick={() => { setResettingPasswordId(null); setNewPasswordVal(''); }}
                    className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ticket Details Modal */}
      <AnimatePresence>
        {viewingTicket && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingTicket(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg shadow-slate-200">
                    <Hash size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl tracking-tighter text-slate-900 leading-none mb-1">
                      INCIDENT #{String(viewingTicket.id).padStart(4, '0')}
                    </h3>
                    <div className="flex items-center gap-2">
                       <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getPriorityStyle(viewingTicket.priority)}`}>
                        {viewingTicket.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                        viewingTicket.status === 'Open' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                        viewingTicket.status === 'Resolved' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-green-50 text-green-600 border-green-100'
                      }`}>
                        {viewingTicket.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleDeleteTicket(viewingTicket.id)}
                    className="p-2 hover:bg-red-50 rounded-xl text-slate-300 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
                    title="Permanently Delete Record"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button 
                    onClick={() => setViewingTicket(null)}
                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-8 overflow-y-auto space-y-8">
                {/* Requester Info */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <User size={12} /> Staff Member
                    </label>
                    <p className="font-bold text-slate-900">{viewingTicket.staff_name}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <ShieldAlert size={12} /> Department
                    </label>
                    <p className="font-bold text-slate-900">{viewingTicket.department}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <MessageSquare size={12} /> Issue Description
                  </label>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-sm text-slate-700 leading-relaxed font-medium">
                    {viewingTicket.description}
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity size={12} /> Lifecycle History
                  </label>
                  <div className="space-y-4">
                    <div className="flex gap-4 relative">
                      <div className="w-px bg-slate-200 absolute left-[11px] top-6 bottom-[-16px]" />
                      <div className="w-6 h-6 rounded-full bg-blue-100 border-4 border-white shadow-sm flex-shrink-0 flex items-center justify-center z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase">Ticket Generated</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                          {new Date(viewingTicket.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {viewingTicket.resolved_at && (
                      <div className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-green-100 border-4 border-white shadow-sm flex-shrink-0 flex items-center justify-center z-10">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase">Resolved & Verified</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                            {new Date(viewingTicket.resolved_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                {viewingTicket.resolution_time_minutes !== null && (
                  <div className="bg-blue-600 rounded-3xl p-6 text-white flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Resolution Velocity</p>
                      <p className="text-3xl font-black">{viewingTicket.resolution_time_minutes} <span className="text-sm font-bold opacity-80 uppercase tracking-widest">Minutes</span></p>
                    </div>
                    <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
                      <Clock size={32} />
                    </div>
                  </div>
                )}

                {/* Direct Messaging Interface */}
                <div className="pt-6 border-t border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                    <MessageSquare size={12} /> Direct_Comm_Secure_Tunnel
                  </label>
                  
                  <div className="bg-slate-900 rounded-2xl p-4 mb-4 max-h-[200px] overflow-y-auto space-y-3 custom-scrollbar">
                    {ticketMessages.length === 0 ? (
                      <div className="py-8 text-center text-[10px] font-black uppercase text-slate-700 tracking-widest">
                        No previous transmissions detected.
                      </div>
                    ) : (
                      ticketMessages.map((msg) => (
                        <div key={msg.id} className={`p-4 rounded-2xl border-l-4 ${msg.sender_name === 'admin' ? 'bg-slate-800 border-blue-500' : 'bg-slate-900 border-slate-700'}`}>
                           <div className="flex justify-between items-start mb-1">
                             <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">PAN_OFFICIAL: {msg.sender_name}</p>
                             <p className="text-[9px] font-bold text-slate-500 tabular-nums">
                               {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </p>
                           </div>
                           <p className="text-white text-xs font-medium leading-relaxed">{msg.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input 
                      id="direct-msg-input"
                      placeholder="Type a direct message to responder..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value;
                          handleSendDirect(viewingTicket.id, val);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('direct-msg-input') as HTMLInputElement;
                        handleSendDirect(viewingTicket.id, input.value);
                        input.value = '';
                      }}
                      className="px-6 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all font-bold"
                    >
                      SEND
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-6">
                {viewingTicket.status === 'Open' ? (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      Operational_Authorization
                    </label>
                    <button 
                      onClick={() => setTicketStatus(viewingTicket.id, 'Resolved')}
                      className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} /> Open
                    </button>
                    <p className="text-[9px] text-slate-400 font-bold uppercase text-center tracking-tighter">Verified staff verification required for final closure.</p>
                  </div>
                ) : (
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${viewingTicket.status === 'Resolved' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                      {viewingTicket.status === 'Resolved' ? <Circle size={20} /> : <CheckCircle size={20} />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Current_Transmission_Status</p>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{viewingTicket.status}</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    Re-Grade Priority
                  </label>
                  <div className="flex gap-2">
                    {(['Low', 'Medium', 'Critical'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setPriority(viewingTicket.id, p)}
                        className={`flex-1 py-3 px-2 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${
                          viewingTicket.priority === p ? getPriorityStyle(p) + ' shadow-md ring-2 ring-offset-2 ring-slate-100' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 md:bottom-8 md:left-1/2 md:-translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-4 md:gap-8 max-w-4xl"
          >
            <div className="flex items-center justify-between w-full md:w-auto md:pr-8 md:border-r md:border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <CheckSquare size={16} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">{selectedIds.length} Selected</p>
                  <button onClick={() => setSelectedIds([])} className="text-[10px] text-slate-400 hover:text-white font-bold transition-colors">Clear Selection</button>
                </div>
              </div>
              <button 
                onClick={() => setSelectedIds([])}
                className="md:hidden text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</span>
                <div className="flex gap-2">
                  <button onClick={() => handleBulkStatus('Resolved')} className="px-5 py-1.5 bg-amber-500 hover:bg-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20">Mark Resolved</button>
                </div>
              </div>

              <div className="flex items-center gap-4 ml-auto">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority</span>
                <div className="flex gap-2">
                  <button onClick={() => handleBulkPriority('Low')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Low</button>
                  <button onClick={() => handleBulkPriority('Medium')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Med</button>
                  <button onClick={() => handleBulkPriority('Critical')} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Crit</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

          {/* Operations Interface Header */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col xl:flex-row">
            {/* Left Side: Stats Panel */}
            <div className="xl:w-3/5 p-8 border-r border-slate-100 flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Incident_Registry_Metrics</p>
                  <h2 className="text-xl font-black text-slate-900 uppercase">Operations Overview</h2>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                   <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Real-time Sync</span>
                </div>
              </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="pb-6 sm:pb-0 sm:pr-8">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">System_Load</p>
              <div className="flex items-baseline gap-4">
                <p className="text-5xl font-black text-slate-900 tracking-tighter">{tickets.filter(t => t.status === 'Open').length}</p>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase leading-none">Active</span>
                  <span className="text-[10px] font-black text-slate-300 uppercase">/ {tickets.length} Total</span>
                </div>
              </div>
            </div>
            
            <div className="pt-6 sm:pt-0 sm:pl-8">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Critical_Priority</p>
              <div className="flex items-baseline gap-2 text-red-600">
                <p className="text-5xl font-black tracking-tighter">{tickets.filter(t => t.priority === 'Critical' && t.status === 'Open').length}</p>
                <div className="bg-red-50 p-1.5 rounded-lg border border-red-100">
                   <AlertTriangle size={16} className="animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Performance Panel */}
        <div className="lg:w-2/5 flex flex-col border-l border-slate-100">
           <div className="p-8 border-b border-slate-100 flex-1">
              <div className="flex items-center justify-between mb-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Response_Velocity</p>
                 <Clock size={16} className="text-slate-300" />
              </div>
              <div className="flex items-baseline gap-3 mb-6">
                 <p className="text-7xl font-black text-slate-900 tracking-tighter">
                   {tickets.filter(t => t.resolution_time_minutes).length > 0
                     ? Math.round(tickets.reduce((acc, t) => acc + (t.resolution_time_minutes || 0), 0) / tickets.filter(t => t.resolution_time_minutes).length)
                     : 0}
                 </p>
                 <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-500 uppercase">Avg</span>
                    <span className="text-xs font-black text-slate-900 uppercase leading-none">Min</span>
                 </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity size={14} className="text-blue-400" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Directive Transmission</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    value={globalMessage}
                    onChange={(e) => setGlobalMessage(e.target.value)}
                    placeholder="Global directive..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleBroadcast()}
                  />
                  <button 
                    onClick={handleBroadcast}
                    disabled={isBroadcasting}
                    className="bg-slate-900 text-white px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all disabled:opacity-50 active:scale-95"
                  >
                    {isBroadcasting ? '...' : 'Launch'}
                  </button>
                </div>
              </div>
           </div>
           
           <div className="p-8 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Sync</p>
                   <p className="text-sm font-black text-slate-900">OPERATIONAL_92%</p>
                </div>
              </div>
              <Activity size={24} className="text-slate-200" />
           </div>
        </div>
      </div>


      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('tickets')}
          className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
            activeTab === 'tickets' 
              ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200 scale-[1.02]' 
              : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
          }`}
        >
          Incident_Registry
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
            activeTab === 'users' 
              ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200 scale-[1.02]' 
              : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
          }`}
        >
          Staff_Governance
        </button>
      </div>

      {activeTab === 'tickets' ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col min-h-0 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  {(['All', 'Open', 'Resolved', 'Closed'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        statusFilter === f 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-slate-900 pl-4 pr-3 py-2 rounded-2xl shadow-lg shadow-blue-500/10 border border-slate-800 group/prior">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-2.5 h-0.5 bg-blue-500 rounded-full transition-all group-hover/prior:bg-blue-400" />
                    <div className="w-1.5 h-0.5 bg-blue-500/60 rounded-full transition-all group-hover/prior:bg-blue-400/80" />
                    <div className="w-0.5 h-0.5 bg-blue-500/30 rounded-full transition-all group-hover/prior:bg-blue-400/60" />
                  </div>
                  <select 
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as any)}
                    className="bg-transparent text-[10px] font-black uppercase tracking-[0.1em] text-slate-300 focus:outline-none cursor-pointer hover:text-white transition-colors"
                  >
                    <option value="All" className="bg-slate-900 text-white">All_Priorities</option>
                    <option value="Low" className="bg-slate-900 text-white">Low</option>
                    <option value="Medium" className="bg-slate-900 text-white">Medium</option>
                    <option value="Critical" className="bg-slate-900 text-white">Critical</option>
                  </select>
                </div>

                <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-[1.25rem] border border-slate-200 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95 group"
                  title="Export Filtered Manifest to CSV"
                >
                  <Download size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                  Export_Manifest
                </button>

                <button 
                  onClick={fetchTickets}
                  className="p-3.5 bg-white text-slate-400 rounded-[1.25rem] border border-slate-200 hover:text-slate-900 hover:border-slate-900 transition-all active:scale-95 shadow-sm"
                  title="Sync Database"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </div>

        {errorMsg ? (
          <div className="py-24 text-center px-8">
            <div className="p-4 bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-red-100">
               <ShieldAlert className="text-red-500" size={24} />
            </div>
            <p className="font-black text-sm text-red-600 uppercase tracking-widest mb-2">{errorMsg}</p>
            <button 
              onClick={fetchTickets}
              className="mt-4 px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all"
            >
              Retry Sync
            </button>
          </div>
        ) : loading ? (
          <div className="py-24 text-center font-bold animate-pulse uppercase tracking-widest text-xs text-slate-300">
            Fetching central records database...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="w-10 px-6 py-4"></th>
                  <th className="w-12 px-6 py-4">
                    <button 
                      onClick={toggleSelectAll}
                      className={`p-1 rounded transition-all ${selectedIds.length === processedTickets.length && processedTickets.length > 0 ? 'text-blue-600' : 'text-slate-300 hover:text-slate-400'}`}
                    >
                      {selectedIds.length === processedTickets.length && processedTickets.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </th>
                  <th onClick={() => requestSort('id')} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group/header active:bg-slate-100">
                    <div className="flex items-center gap-2">
                       Ticket_ID <SortIcon column="id" />
                    </div>
                  </th>
                  <th onClick={() => requestSort('staff_name')} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group/header active:bg-slate-100">
                    <div className="flex items-center gap-2">
                      Requester <SortIcon column="staff_name" />
                    </div>
                  </th>
                  <th onClick={() => requestSort('description')} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group/header active:bg-slate-100">
                    <div className="flex items-center gap-2">
                      Description <SortIcon column="description" />
                    </div>
                  </th>
                  <th onClick={() => requestSort('priority')} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer group/header active:bg-slate-100">
                    <div className="flex items-center gap-2 justify-center">
                      Priority <SortIcon column="priority" />
                    </div>
                  </th>
                  <th onClick={() => requestSort('status')} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer group/header active:bg-slate-100">
                    <div className="flex items-center gap-2 justify-center">
                      Status <SortIcon column="status" />
                    </div>
                  </th>
                  <th onClick={() => requestSort('created_at')} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group/header active:bg-slate-100">
                    <div className="flex items-center gap-2">
                      Complaint_Time <SortIcon column="created_at" />
                    </div>
                  </th>
                  <th onClick={() => requestSort('resolved_at')} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group/header active:bg-slate-100">
                    <div className="flex items-center gap-2">
                      Resolved_Time <SortIcon column="resolved_at" />
                    </div>
                  </th>
                  <th onClick={() => requestSort('resolution_time_minutes')} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer group/header active:bg-slate-100">
                    <div className="flex items-center gap-2 justify-center">
                      Time_Taken <SortIcon column="resolution_time_minutes" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedTickets.map(ticket => (
                  <tr 
                    key={ticket.id} 
                    onClick={() => setViewingTicket(ticket)}
                    className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${selectedIds.includes(ticket.id) ? 'bg-blue-50/50' : ''}`}
                  >
                    <td className="px-6 py-4">
                       <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteTicket(ticket.id); }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Ticket"
                       >
                         <Trash2 size={16} />
                       </button>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={(e) => toggleSelect(e, ticket.id)}
                        className={`p-1 rounded transition-colors ${selectedIds.includes(ticket.id) ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-400'}`}
                      >
                        {selectedIds.includes(ticket.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-slate-400 font-medium">#{String(ticket.id).padStart(4, '0')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-slate-900 leading-tight">{ticket.staff_name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-tighter">{ticket.department}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600 line-clamp-1 max-w-[200px]">{ticket.description}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePriorityChange(ticket.id, ticket.priority); }}
                        className={`inline-block px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border cursor-pointer hover:brightness-95 active:scale-95 transition-all ${getPriorityStyle(ticket.priority)}`}
                      >
                        {ticket.priority}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {ticket.status === 'Open' ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setTicketStatus(ticket.id, 'Resolved'); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full font-bold text-[9px] uppercase tracking-widest transition-all hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-200"
                        >
                          Open
                        </button>
                      ) : (
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[9px] uppercase tracking-widest border ${
                          ticket.status === 'Resolved' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-green-50 text-green-600 border-green-100'
                        }`}>
                          {ticket.status === 'Resolved' ? <Circle size={10} className="fill-current" /> : <CheckCircle size={10} className="fill-current" />}
                          {ticket.status}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[10px] text-slate-500 font-medium">
                      {new Date(ticket.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 text-[10px] text-slate-500 font-medium">
                      {ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '---'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {ticket.resolution_time_minutes ? (
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-black text-slate-900">{ticket.resolution_time_minutes}m</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">VELOCITY</span>
                        </div>
                      ) : (
                        <div className="w-4 h-0.5 bg-slate-100 mx-auto rounded-full"></div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {processedTickets.length === 0 && (
              <div className="py-32 text-center px-8">
                <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <ShieldAlert className="text-slate-200" size={32} />
                </div>
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight mb-2">Zero Record Matches</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Adjust parameters or refresh system sync.</p>
                <div className="flex gap-4 justify-center mt-8">
                  <button 
                    onClick={fetchTickets}
                    className="px-8 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
                  >
                    Force Sync Now
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center rounded-b-2xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Showing {processedTickets.length} of {tickets.length} total entries
          </p>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 bg-white border border-slate-200 text-[10px] font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors">1</button>
            <button className="px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors">2</button>
          </div>
        </div>
      </div>
    ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="font-bold text-lg tracking-tight text-slate-900">Enterprise Personnel Directory</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master record of authorized PAN group operatives</p>
            </div>
            <div className="flex gap-2">
               <button 
                onClick={() => setShowRegisterModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg shadow-blue-100"
              >
                <UserPlus size={14} /> Onboard Personnel
              </button>
              <button onClick={fetchUsers} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User_ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clearance_Level</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-slate-400 tabular-nums">#{String(u.id).padStart(4, '0')}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">{u.username}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{u.department || 'Unassigned'}</td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                         u.role === 'admin' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                       }`}>
                         {u.role}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                      <button 
                        onClick={() => setResettingPasswordId(u.id)}
                        className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 underline underline-offset-4 tracking-widest"
                      >
                        Reset Credentials
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                        title="Delete Personnel"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
