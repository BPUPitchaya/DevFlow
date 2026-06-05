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

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [velocityResponse, bottleneckResponse] = await Promise.all([
        analyticsApi.getVelocity({ teamId: user?.team?.id, days: 30 }),
        analyticsApi.getBottlenecks({ teamId: user?.team?.id, days: 30 }),
      ]);

      setVelocityData(velocityResponse.data);
      setBottleneckData(bottleneckResponse.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

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
