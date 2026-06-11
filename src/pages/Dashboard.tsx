import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Ticket, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Activity, 
  XOctagon,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const { user, isAdmin, getToken } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    urgent: 0
  });

  const [recentTickets, setRecentTickets] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation this would fetch dashboard specific stats via a new endpoint 
    // `app.get('/api/dashboard/stats', ...)`
    // Here we will fetch all tickets and compute stats locally for simplicity, assuming data volume isn't huge in this demo.
    const fetchDashboardData = async () => {
      try {
        const endpoint = isAdmin ? '/api/tickets' : '/api/my-tickets';
        const res = await fetch(endpoint, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const tickets = await res.json();
        
        if (Array.isArray(tickets)) {
          setRecentTickets(tickets.slice(0, 5) as any);
          
          let s = { total: tickets.length, new: 0, pending: 0, inProgress: 0, resolved: 0, closed: 0, urgent: 0 };
          
          const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d;
          });

          const daysNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          
          const realChart = last7Days.map(date => {
            const dateString = date.toISOString().split('T')[0];
            let ticketCount = 0;
            let resolvedCount = 0;
            
            tickets.forEach((t: any) => {
              if (t.created_at) {
                const ticketDateStr = new Date(t.created_at).toISOString().split('T')[0];
                if (ticketDateStr === dateString) {
                  ticketCount++;
                }
              }
              if (t.resolved_at) {
                const resolvedDateStr = new Date(t.resolved_at).toISOString().split('T')[0];
                if (resolvedDateStr === dateString) {
                  resolvedCount++;
                }
              }
            });
            
            return {
              name: daysNames[date.getDay()],
              tickets: ticketCount,
              resolved: resolvedCount
            };
          });
          
          setChartData(realChart as any);

          tickets.forEach((t: any) => {
            if (t.status === 'New') s.new++;
            else if (t.status === 'Pending') s.pending++;
            else if (t.status === 'In Progress') s.inProgress++;
            else if (t.status === 'Resolved') s.resolved++;
            else if (t.status === 'Closed') s.closed++;
            else if (t.status === 'Open') s.new++; // fallback
            
            if (t.priority === 'Urgent' || t.priority === 'Critical' || t.priority === 'High') {
              s.urgent++;
            }
          });
          
          setStats(s);
        }
      } catch (err) {
        console.error("Dashboard data error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin, getToken]);

  const statCards = [
    { label: 'Total Tickets', value: stats.total, icon: <Ticket className="text-blue-600" />, bg: 'bg-blue-50' },
    { label: 'New Complaints', value: stats.new, icon: <AlertTriangle className="text-amber-500" />, bg: 'bg-amber-50' },
    { label: 'In Progress', value: stats.inProgress + stats.pending, icon: <Activity className="text-indigo-500" />, bg: 'bg-indigo-50' },
    { label: 'Resolved', value: stats.resolved, icon: <CheckCircle2 className="text-emerald-500" />, bg: 'bg-emerald-50' },
    { label: 'Closed', value: stats.closed, icon: <XOctagon className="text-slate-500" />, bg: 'bg-slate-100' },
    { label: 'Urgent Issues', value: stats.urgent, icon: <Clock className="text-red-500" />, bg: 'bg-red-50' },
  ];

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-8 bg-slate-200 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-white rounded-xl border border-slate-100"></div>)}
      </div>
    </div>
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500">Welcome back, {user?.username}. Here's what's happening today.</p>
        </div>
        {!isAdmin && (
          <Link 
            to="/tickets/new" 
            className="inline-flex items-center gap-2 bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-800 transition-colors shadow-sm shadow-blue-200 whitespace-nowrap"
          >
            <Ticket size={18} /> Create New Ticket
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={card.label} 
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-lg ${card.bg}`}>
                {card.icon}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 leading-none mb-1">{card.value}</h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Weekly Ticket Volume</h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                />
                <Area type="monotone" dataKey="tickets" name="New Tickets" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTickets)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
            <Link to="/tickets" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            {recentTickets.length > 0 ? (
              <div className="space-y-6">
                {recentTickets.map((ticket: any) => (
                  <div key={ticket.id} className="relative pl-6 before:absolute before:left-1 before:top-2 before:bottom-[-16px] before:w-px before:bg-slate-200 last:before:hidden">
                    <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white"></div>
                    <p className="text-sm font-medium text-slate-900 mb-0.5">
                      New ticket <span className="text-blue-600">#{ticket.id}</span>
                    </p>
                    <p className="text-xs text-slate-500 mb-1">{ticket.description.substring(0, 40)}...</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">{new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                <Ticket size={32} className="opacity-50" />
                <p className="text-sm">No recent activity found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
