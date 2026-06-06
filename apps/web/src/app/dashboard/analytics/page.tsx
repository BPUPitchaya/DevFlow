'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { analyticsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AnalyticsPage() {
  const user = useAuthStore((state) => state.user);
  const [velocityData, setVelocityData] = useState<any[]>([]);
  const [bottleneckData, setBottleneckData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demo
  const mockVelocityData = [
    { date: 'May 1', total: 12, blocked: 2, uniqueUsers: 5 },
    { date: 'May 2', total: 15, blocked: 1, uniqueUsers: 6 },
    { date: 'May 3', total: 14, blocked: 3, uniqueUsers: 5 },
    { date: 'May 4', total: 18, blocked: 0, uniqueUsers: 6 },
    { date: 'May 5', total: 16, blocked: 2, uniqueUsers: 5 },
    { date: 'May 6', total: 20, blocked: 1, uniqueUsers: 6 },
    { date: 'May 7', total: 19, blocked: 0, uniqueUsers: 5 },
    { date: 'May 8', total: 22, blocked: 3, uniqueUsers: 6 },
    { date: 'May 9', total: 21, blocked: 1, uniqueUsers: 5 },
    { date: 'May 10', total: 24, blocked: 2, uniqueUsers: 6 },
    { date: 'May 11', total: 23, blocked: 0, uniqueUsers: 5 },
    { date: 'May 12', total: 25, blocked: 1, uniqueUsers: 6 },
    { date: 'May 13', total: 26, blocked: 2, uniqueUsers: 5 },
    { date: 'May 14', total: 28, blocked: 0, uniqueUsers: 6 },
    { date: 'May 15', total: 27, blocked: 1, uniqueUsers: 5 },
    { date: 'May 16', total: 30, blocked: 2, uniqueUsers: 6 },
    { date: 'May 17', total: 29, blocked: 0, uniqueUsers: 5 },
    { date: 'May 18', total: 31, blocked: 1, uniqueUsers: 6 },
    { date: 'May 19', total: 32, blocked: 2, uniqueUsers: 5 },
    { date: 'May 20', total: 33, blocked: 0, uniqueUsers: 6 },
    { date: 'May 21', total: 34, blocked: 1, uniqueUsers: 5 },
    { date: 'May 22', total: 35, blocked: 2, uniqueUsers: 6 },
    { date: 'May 23', total: 36, blocked: 0, uniqueUsers: 5 },
    { date: 'May 24', total: 37, blocked: 1, uniqueUsers: 6 },
    { date: 'May 25', total: 38, blocked: 2, uniqueUsers: 5 },
    { date: 'May 26', total: 39, blocked: 0, uniqueUsers: 6 },
    { date: 'May 27', total: 40, blocked: 1, uniqueUsers: 5 },
    { date: 'May 28', total: 41, blocked: 2, uniqueUsers: 6 },
    { date: 'May 29', total: 42, blocked: 0, uniqueUsers: 5 },
    { date: 'May 30', total: 43, blocked: 1, uniqueUsers: 6 },
  ];

  const mockBottleneckData = [
    { name: 'API Documentation', frequency: 15 },
    { name: 'Code Review', frequency: 12 },
    { name: 'Deployment', frequency: 10 },
    { name: 'Testing', frequency: 8 },
    { name: 'Design Assets', frequency: 7 },
    { name: 'Server Issues', frequency: 6 },
    { name: 'Database', frequency: 5 },
    { name: 'Third-party APIs', frequency: 4 },
    { name: 'Communication', frequency: 3 },
    { name: 'Requirements', frequency: 2 },
  ];

  useEffect(() => {
    // Load mock data
    setVelocityData(mockVelocityData);
    setBottleneckData(mockBottleneckData);
    setLoading(false);
  }, []);

  const loadAnalytics = () => {};

  if (loading) {
    return (
      <DashboardLayout activeTab="analytics">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="analytics">
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-900">Sprint Analytics</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Team Velocity
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={velocityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#2563eb"
                    strokeWidth={2}
                    name="Total Standups"
                  />
                  <Line
                    type="monotone"
                    dataKey="blocked"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Blocked"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Bottleneck Detection
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bottleneckData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="frequency" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total Standups</p>
            <p className="text-3xl font-bold text-gray-900">
              {velocityData.reduce((sum, day) => sum + day.total, 0)}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Blocked Items</p>
            <p className="text-3xl font-bold text-red-600">
              {velocityData.reduce((sum, day) => sum + day.blocked, 0)}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Team Participation</p>
            <p className="text-3xl font-bold text-green-600">
              {velocityData.length > 0
                ? Math.round(
                    (velocityData.reduce((sum, day) => sum + day.uniqueUsers, 0) /
                      velocityData.length) *
                      10
                  ) / 10
                : 0}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
