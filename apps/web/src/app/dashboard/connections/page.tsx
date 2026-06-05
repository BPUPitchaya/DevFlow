'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/lib/store';
import { UserPlus, Check, X, Search } from 'lucide-react';

interface Connection {
  id: string;
  status: string;
  requester: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  receiver: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function ConnectionsPage() {
  const user = useAuthStore((state) => state.user);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const response = await fetch('/api/connections');
      const data = await response.json();
      setConnections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load connections:', error);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.filter((u: User) => u.id !== user?.id));
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const sendConnectionRequest = async (receiverId: string) => {
    try {
      await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId }),
      });
      setSearchResults([]);
      setSearchQuery('');
      setShowSearch(false);
      loadConnections();
    } catch (error) {
      console.error('Failed to send request:', error);
    }
  };

  const updateConnection = async (connectionId: string, status: string) => {
    try {
      await fetch(`/api/connections/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      loadConnections();
    } catch (error) {
      console.error('Failed to update connection:', error);
    }
  };

  const deleteConnection = async (connectionId: string) => {
    try {
      await fetch(`/api/connections/${connectionId}`, {
        method: 'DELETE',
      });
      loadConnections();
    } catch (error) {
      console.error('Failed to delete connection:', error);
    }
  };

  const pendingRequests = connections.filter(
    (c) => c.status === 'pending' && c.receiverId === user?.id
  );
  const myRequests = connections.filter(
    (c) => c.status === 'pending' && c.requesterId === user?.id
  );
  const acceptedConnections = connections.filter((c) => c.status === 'accepted');

  if (loading) {
    return (
      <DashboardLayout activeTab="connections">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="connections">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Connections</h2>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Find People</span>
          </button>
        </div>

        {showSearch && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map((searchUser) => (
                  <div
                    key={searchUser.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {searchUser.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{searchUser.name}</p>
                        <p className="text-sm text-gray-500">{searchUser.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => sendConnectionRequest(searchUser.id)}
                      className="text-sm bg-gray-900 text-white px-3 py-1 rounded hover:bg-gray-800 transition"
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {pendingRequests.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Pending Requests ({pendingRequests.length})
            </h3>
            <div className="space-y-3">
              {pendingRequests.map((connection) => (
                <div
                  key={connection.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {connection.requester.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {connection.requester.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {connection.requester.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateConnection(connection.id, 'accepted')}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateConnection(connection.id, 'rejected')}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {myRequests.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Sent Requests ({myRequests.length})
            </h3>
            <div className="space-y-3">
              {myRequests.map((connection) => (
                <div
                  key={connection.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {connection.receiver.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {connection.receiver.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {connection.receiver.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-yellow-600">Pending</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            My Connections ({acceptedConnections.length})
          </h3>
          {acceptedConnections.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No connections yet. Start connecting!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {acceptedConnections.map((connection) => {
                const connectedUser =
                  connection.requesterId === user?.id
                    ? connection.receiver
                    : connection.requester;
                return (
                  <div
                    key={connection.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {connectedUser.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {connectedUser.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {connectedUser.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteConnection(connection.id)}
                      className="w-full text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg py-2 hover:bg-red-50 transition"
                    >
                      Remove Connection
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
