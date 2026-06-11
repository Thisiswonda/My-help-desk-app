import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, Clock, MessageSquare, Paperclip, 
  User, CheckCircle2, AlertTriangle, Printer,
  UserPlus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function TicketDetail() {
  const { id } = useParams();
  const { getToken, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // In a real app we'd fetch the specific ticket here
    // For this demo, we'll fetch all and find the one.
    const fetchTicket = async () => {
      try {
        const endpoint = isAdmin ? '/api/tickets' : '/api/my-tickets';
        const res = await fetch(endpoint, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          const t = data.find(item => item.id.toString() === id);
          if (t) setTicket(t);
        }

        const msgRes = await fetch(`/api/messages/ticket/${id}`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const msgData = await msgRes.json();
        if (Array.isArray(msgData)) setMessages(msgData);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id, isAdmin, getToken]);

  const updateStatus = async (status: string) => {
    setActionLoading(true);
    try {
      await fetch(`/api/tickets/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ status })
      });
      setTicket({ ...ticket, status });
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          ticket_id: id,
          text: newMessage,
          type: 'Direct'
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages([...messages, {
          id: data.messageId,
          ticket_id: id,
          user_id: user?.id,
          sender_name: user?.username || 'Unknown',
          text: newMessage,
          type: 'Direct',
          created_at: new Date().toISOString()
        }]);
        setNewMessage('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Ticket Not Found</h2>
        <p className="text-slate-500 mb-6">The requested record could not be found or you lack clearance to view it.</p>
        <button onClick={() => navigate('/tickets')} className="text-blue-600 font-medium hover:underline">
          Return to Hub
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <button 
            onClick={() => navigate('/tickets')}
            className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 mb-3 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to List
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">#{ticket.id}</h1>
            <span className={cn(
              "px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full ring-1 ring-inset",
              ticket.status === 'Open' || ticket.status === 'New' ? 'bg-red-50 text-red-700 ring-red-600/20' :
              ticket.status === 'Pending' || ticket.status === 'In Progress' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
              ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
              'bg-blue-50 text-blue-700 ring-blue-600/20'
            )}>
              {ticket.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {ticket.status !== 'Closed' && isAdmin && (
            <>
              {ticket.status !== 'In Progress' && (
                <button 
                  onClick={() => updateStatus('In Progress')}
                  disabled={actionLoading}
                  className="bg-white border border-slate-200 shadow-sm text-slate-700 font-medium px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Start Processing
                </button>
              )}
              {ticket.status !== 'Resolved' && (
                <button 
                  onClick={() => updateStatus('Resolved')}
                  disabled={actionLoading}
                  className="bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
                >
                  Mark Resolved
                </button>
              )}
            </>
          )}
          {ticket.status === 'Resolved' && !isAdmin && ticket.user_id === user?.id && (
            <button 
              onClick={() => updateStatus('Closed')}
              disabled={actionLoading}
              className="bg-blue-700 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors shadow-sm shadow-blue-200"
            >
              Verify & Close
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Request Description</h2>
            <div className="prose prose-slate max-w-none">
              <p className="whitespace-pre-wrap text-slate-700">{ticket.description}</p>
            </div>
          </div>

          {/* Internal Comments / Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-600" />
                Comments & History
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest my-4">
                Ticket Created • {format(new Date(ticket.created_at), "MMM d, yyyy")}
              </div>
              
              {messages.map((msg, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <User size={14} className="text-blue-600" />
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-slate-200 w-full shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-semibold text-slate-900">{msg.sender_name}</p>
                      <span className="text-xs text-slate-400">{format(new Date(msg.created_at), "MMM d • h:mm a")}</span>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-200 bg-white">
              <form onSubmit={handlePostMessage} className="flex gap-3">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type an internal note..." 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
                <button type="submit" disabled={!newMessage.trim()} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Post
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Ticket Details</h3>
            <div className="space-y-4 text-sm">
              <div>
                <span className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Requestor</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                    {ticket.staff_name.charAt(0)}
                  </div>
                  <span className="font-semibold text-slate-900">{ticket.staff_name}</span>
                </div>
              </div>
              <div>
                <span className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Department</span>
                <span className="font-medium text-slate-900">{ticket.department}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Category</span>
                <span className="font-medium text-slate-900 uppercase tracking-widest text-[#000000]">{ticket.category || 'General'}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Priority</span>
                <span className={cn(
                  "font-bold uppercase tracking-widest text-xs",
                  ticket.priority === 'High' || ticket.priority === 'Urgent' || ticket.priority === 'Critical' ? 'text-red-600' :
                  ticket.priority === 'Medium' ? 'text-amber-600' : 'text-blue-600'
                )}>
                  {ticket.priority}
                </span>
              </div>
              <div>
                <span className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Submitted at</span>
                <span className="font-medium text-slate-900 flex items-center gap-1.5">
                  <Clock size={14} className="text-slate-400" />
                  {format(new Date(ticket.created_at), "MMM d, yyyy 'at' HH:mm")}
                </span>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
