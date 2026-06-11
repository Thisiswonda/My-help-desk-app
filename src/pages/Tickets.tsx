import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Filter, Search, Plus, MoreVertical, 
  CheckCircle2, Clock, XCircle, AlertCircle, 
  ChevronDown, ArrowUpDown, Download
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface Ticket {
  id: number;
  staff_name: string;
  department: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

import { Link, useNavigate } from 'react-router-dom';

export default function Tickets() {
  const { isAdmin, getToken } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  useEffect(() => {
    fetchTickets();
  }, [isAdmin]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const endpoint = isAdmin ? '/api/tickets' : '/api/my-tickets';
      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setTickets(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
      case 'New':
        return 'bg-red-50 text-red-700 ring-red-600/20';
      case 'Pending':
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 ring-amber-600/20';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
      case 'Closed':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-600/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
      case 'Urgent':
      case 'High':
        return 'text-red-600 bg-red-50';
      case 'Medium':
        return 'text-amber-600 bg-amber-50';
      case 'Low':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toString().includes(searchTerm);
      
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const downloadCSV = () => {
    const headers = ['ID', 'Staff Name', 'Department', 'Category', 'Description', 'Priority', 'Status', 'Date Submitted'];
    const rows = filteredTickets.map(t => [
      t.id,
      `"${t.staff_name.replace(/"/g, '""')}"`,
      `"${t.department.replace(/"/g, '""')}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.priority}"`,
      `"${t.status}"`,
      `"${format(new Date(t.created_at), "yyyy-MM-dd HH:mm")}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tickets_export_${format(new Date(), "yyyyMMdd_HHmm")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Ticket Hub
          </h1>
          <p className="text-slate-500 text-sm">
            Manage, track, and resolve internal organizational requests.
          </p>
        </div>
        {!isAdmin && (
          <button 
            onClick={() => navigate('/tickets/new')}
            className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-800 transition-colors shadow-sm focus:ring-4 focus:ring-blue-100"
          >
            <Plus size={18} />
            <span>New Ticket</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by ID, staff name, or description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium text-slate-900 placeholder:font-normal"
            />
          </div>
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="New">New</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={downloadCSV}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg focus:outline-none hover:bg-slate-50 transition-colors"
          >
            <Download size={16} /> Export
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg focus:outline-none hover:bg-slate-50 transition-colors">
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-800">
                    ID <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-6 py-4">Requestor Info</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">Date Subm.</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 whitespace-nowrap">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm font-medium text-slate-500">Loading records...</p>
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
                      <Search size={24} />
                    </div>
                    <p className="text-sm font-medium text-slate-900">No records found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr 
                    key={ticket.id} 
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-semibold text-blue-600 group-hover:text-blue-700">#{ticket.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">{ticket.staff_name}</span>
                        <span className="text-xs text-slate-500">{ticket.department}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-[250px] max-w-[400px]">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-0.5">{ticket.category}</span>
                        <span className="text-sm text-slate-700 truncate">{ticket.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 block">
                        {format(new Date(ticket.created_at), "MMM d, yyyy")}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {format(new Date(ticket.created_at), "HH:mm")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest",
                        getPriorityColor(ticket.priority)
                      )}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset",
                        getStatusColor(ticket.status)
                      )}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-100 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-sm text-slate-500 font-medium">
          <div>Showing 1 to {filteredTickets.length} of {filteredTickets.length} results</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50">Prev</button>
            <button className="px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
