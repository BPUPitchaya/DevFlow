'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/lib/store';
import { Plus, Users, Calendar, CheckCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Team {
  id: string;
  name: string;
  _count: { members: number };
}

interface Milestone {
  id: string;
  name: string;
  completed: boolean;
  approved: boolean;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  priority?: 'High' | 'Medium' | 'Low';
  milestones?: Milestone[];
}

interface Activity {
  id: string;
  type: string;
  projectName: string;
  userName: string;
  timestamp: Date;
  details?: string;
}

const mockTeams: Team[] = [
  { id: 't1', name: 'Engineering Team', _count: { members: 5 } },
  { id: 't2', name: 'Design Team', _count: { members: 3 } },
];

const mockProjects: Record<string, Project[]> = {
  't1': [
    {
      id: 'p1',
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website',
      status: 'In Progress',
      progress: 65,
      priority: 'High',
      milestones: [
        { id: 'm1', name: 'Design mockups', completed: true, approved: true },
        { id: 'm2', name: 'Frontend dev', completed: false, approved: false },
      ]
    },
    {
      id: 'p2',
      name: 'Mobile App',
      description: 'Native mobile application',
      status: 'Planning',
      progress: 20,
      priority: 'Medium',
      milestones: []
    }
  ],
  't2': [
    {
      id: 'p3',
      name: 'Brand Guidelines',
      description: 'Update brand identity',
      status: 'Completed',
      progress: 100,
      priority: 'High',
      milestones: []
    }
  ]
};

const mockActivities: Activity[] = [
  { id: 'a1', type: 'milestone_completed', projectName: 'Website Redesign', userName: 'John Doe', timestamp: new Date(Date.now() - 3600000), details: 'Completed milestone: Design mockups' },
  { id: 'a2', type: 'comment_added', projectName: 'Website Redesign', userName: 'Jane Smith', timestamp: new Date(Date.now() - 7200000), details: 'Added comment on project' },
  { id: 'a3', type: 'project_created', projectName: 'Mobile App', userName: 'John Doe', timestamp: new Date(Date.now() - 86400000), details: 'Created new project' },
];

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isDemo = useAuthStore((state) => state.isDemo);
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Record<string, Project[]>>({});
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setTeams(mockTeams);
      setProjects(mockProjects);
      setActivities(mockActivities);
    }
    setLoading(false);
  }, [isDemo]);

  if (loading) {
    return (
      <DashboardLayout activeTab="dashboard">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  const allProjects = Object.values(projects).flat();
  const totalProjects = allProjects.length;
  const activeProjects = allProjects.filter(p => p.status === 'In Progress').length;
  const totalMilestones = allProjects.reduce((acc, p) => acc + (p.milestones?.length || 0), 0);
  const completedMilestones = allProjects.reduce((acc, p) => acc + (p.milestones?.filter(m => m.completed).length || 0), 0);
  const totalMembers = teams.reduce((acc, t) => acc + t._count.members, 0);

  return (
    <DashboardLayout activeTab="dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={() => router.push('/dashboard/teams')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Projects</p>
            <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
            <p className="text-xs text-gray-400">{activeProjects} active</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Milestones</p>
            <p className="text-2xl font-bold text-gray-900">{completedMilestones}/{totalMilestones}</p>
            <p className="text-xs text-gray-400">{totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0}% done</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Team Members</p>
            <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
            <p className="text-xs text-gray-400">{teams.length} teams</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Avg Progress</p>
            <p className="text-2xl font-bold text-gray-900">
              {allProjects.length > 0 ? Math.round(allProjects.reduce((acc, p) => acc + p.progress, 0) / allProjects.length) : 0}%
            </p>
            <p className="text-xs text-gray-400">across all projects</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Projects</h2>
            <div className="space-y-2">
              {allProjects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  onClick={() => router.push('/dashboard/teams')}
                  className="p-3 border border-gray-100 rounded hover:bg-gray-50 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-xs text-gray-500">{project.status}</p>
                    </div>
                    <span className="text-sm text-gray-600">{project.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-2">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="p-3 border border-gray-100 rounded">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.userName}</span>
                    <span className="text-gray-500"> in </span>
                    <span className="font-medium text-blue-600">{activity.projectName}</span>
                  </p>
                  <p className="text-xs text-gray-400">{activity.timestamp.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
