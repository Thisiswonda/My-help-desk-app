import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, PieChart, Activity, Users, Ticket } from 'lucide-react';
import { cn } from '../lib/utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

export default function Reports() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    ticketsByStatus: { status: string; count: number }[];
    ticketsByDepartment: { department: string; count: number }[];
    ticketsByPriority: { priority: string; count: number }[];
    totalUsers: number;
    totalTickets: number;
  } | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/reports', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        setData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [getToken]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ef4444'];

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
        <p className="text-slate-500">System-wide metrics and activity reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Ticket size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Tickets</p>
            <p className="text-2xl font-bold text-slate-900">{data?.totalTickets || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Users</p>
            <p className="text-2xl font-bold text-slate-900">{data?.totalUsers || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <PieChart size={18} /> Tickets by Status
          </h3>
          <div className="h-64">
             {data?.ticketsByStatus && data.ticketsByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={data.ticketsByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="status"
                      label
                    >
                      {data.ticketsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-center h-full flex items-center justify-center">No data available.</p>
              )}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 size={18} /> Tickets by Priority
          </h3>
          <div className="h-64 mt-4">
              {data?.ticketsByPriority && data.ticketsByPriority.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.ticketsByPriority}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-center h-full flex items-center justify-center">No data available.</p>
              )}
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Activity size={18} /> Tickets by Department
        </h3>
        <div className="h-64 mt-4">
            {data?.ticketsByDepartment && data.ticketsByDepartment.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.ticketsByDepartment} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="department" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-slate-500 text-center h-full flex items-center justify-center">No data available.</p>
            )}
        </div>
      </div>

    </div>
  );
}
