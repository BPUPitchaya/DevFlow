'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { standupsApi } from '@/lib/api';
import { subscribeToTeam } from '@/lib/pusher';
import { useAuthStore } from '@/lib/store';
import { format } from 'date-fns';
import { MessageCircle, Heart, AlertTriangle } from 'lucide-react';

interface Standup {
  id: string;
  completed: string;
  focus: string;
  blockers?: string;
  isBlocked: boolean;
  date: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  comments: any[];
  reactions: any[];
}

export default function FeedPage() {
  const user = useAuthStore((state) => state.user);
  const [standups, setStandups] = useState<Standup[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demo
  const mockStandups: Standup[] = [
    {
      id: '1',
      completed: 'Finished the user authentication module and fixed the login bug',
      focus: 'Working on the dashboard analytics feature',
      blockers: 'Waiting for API documentation from backend team',
      isBlocked: true,
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: { id: 'u1', name: 'John Doe', avatar: undefined },
      comments: [
        { id: 'c1', user: { name: 'Jane Smith' }, content: 'I can help with the API docs!' }
      ],
      reactions: [
        { id: 'r1', emoji: '👍', user: { name: 'Jane Smith' } },
        { id: 'r2', emoji: '❤️', user: { name: 'Bob Wilson' } }
      ]
    },
    {
      id: '2',
      completed: 'Completed the messaging UI and added real-time updates',
      focus: 'Adding message search and threading features',
      blockers: undefined,
      isBlocked: false,
      date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      user: { id: 'u2', name: 'Jane Smith', avatar: undefined },
      comments: [],
      reactions: [
        { id: 'r3', emoji: '🎉', user: { name: 'John Doe' } }
      ]
    },
    {
      id: '3',
      completed: 'Fixed the database migration issue and updated the schema',
      focus: 'Optimizing database queries for better performance',
      blockers: undefined,
      isBlocked: false,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      user: { id: 'u3', name: 'Bob Wilson', avatar: undefined },
      comments: [
        { id: 'c2', user: { name: 'John Doe' }, content: 'Great work on the migration!' }
      ],
      reactions: []
    },
    {
      id: '4',
      completed: 'Deployed the staging environment and ran integration tests',
      focus: 'Preparing for production deployment',
      blockers: 'Need to fix a critical bug in the payment module',
      isBlocked: true,
      date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      user: { id: 'u1', name: 'John Doe', avatar: undefined },
      comments: [],
      reactions: [
        { id: 'r4', emoji: '🚀', user: { name: 'Jane Smith' } },
        { id: 'r5', emoji: '👍', user: { name: 'Bob Wilson' } }
      ]
    }
  ];

  useEffect(() => {
    // Load mock data
    setStandups(mockStandups);
    setLoading(false);
  }, []);

  // Disable Pusher for demo
  useEffect(() => {}, [user]);

  const loadStandups = () => {};
  const handleAddComment = (standupId: string, content: string) => {
    // Mock implementation
    setStandups(prev => prev.map(s => 
      s.id === standupId 
        ? { ...s, comments: [...s.comments, { id: `c${Date.now()}`, user: { name: 'You' }, content }] }
        : s
    ));
  };
  const handleAddReaction = (standupId: string, emoji: string) => {
    // Mock implementation
    setStandups(prev => prev.map(s => 
      s.id === standupId 
        ? { ...s, reactions: [...s.reactions, { id: `r${Date.now()}`, emoji, user: { name: 'You' } }] }
        : s
    ));
  };

  if (loading) {
    return (
      <DashboardLayout activeTab="feed">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="feed">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Team Activity</h2>
          <span className="text-sm text-gray-500">
            {standups.length} updates
          </span>
        </div>

        {standups.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No standups yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {standups.map((standup) => (
              <div
                key={standup.id}
                className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {standup.user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{standup.user.name}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(standup.date), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                  </div>
                  {standup.isBlocked && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Blocked
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Completed Yesterday
                    </p>
                    <p className="text-gray-900">{standup.completed}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Focus Today
                    </p>
                    <p className="text-gray-900">{standup.focus}</p>
                  </div>

                  {standup.blockers && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Blockers
                      </p>
                      <p className="text-gray-900">{standup.blockers}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => {
                        const comment = prompt('Add a comment:');
                        if (comment) handleAddComment(standup.id, comment);
                      }}
                      className="flex items-center space-x-1 text-gray-500 hover:text-gray-900 text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{standup.comments.length}</span>
                    </button>

                    <button
                      onClick={() => handleAddReaction(standup.id, '👍')}
                      className="flex items-center space-x-1 text-gray-500 hover:text-gray-900 text-sm"
                    >
                      <Heart className="w-4 h-4" />
                      <span>{standup.reactions.length}</span>
                    </button>
                  </div>
                </div>

                {standup.comments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {standup.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-gray-50 rounded-lg p-3"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {comment.user.name}
                        </p>
                        <p className="text-sm text-gray-600">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
