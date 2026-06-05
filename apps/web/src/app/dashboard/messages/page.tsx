'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/lib/store';
import { MessageSquare, Hash, Plus, Search } from 'lucide-react';
import { subscribeToConversation, unsubscribeFromConversation, subscribeToChannel, unsubscribeFromChannel } from '@/lib/pusher';

interface Conversation {
  id: string;
  type: string;
  name?: string;
  participants: {
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
  }[];
  messages: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
      avatar?: string;
    };
  }[];
  _count: {
    messages: number;
  };
}

interface Channel {
  id: string;
  name: string;
  description?: string;
  members: {
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  }[];
  messages: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
      avatar?: string;
    };
  }[];
  _count: {
    messages: number;
  };
}

export default function MessagesPage() {
  const user = useAuthStore((state) => state.user);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'direct' | 'channels'>('direct');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');

  useEffect(() => {
    loadConversations();
    loadChannels();
  }, []);

  useEffect(() => {
    let channel: any = null;

    if (selectedConversation) {
      channel = subscribeToConversation(selectedConversation.id, {
        onMessageSent: (data) => {
          setMessages((prev) => [...prev, data]);
        },
      });
    }

    return () => {
      if (channel) {
        unsubscribeFromConversation(selectedConversation?.id || '');
      }
    };
  }, [selectedConversation]);

  useEffect(() => {
    let channel: any = null;

    if (selectedChannel) {
      channel = subscribeToChannel(selectedChannel.id, {
        onMessageSent: (data) => {
          setMessages((prev) => [...prev, data]);
        },
      });
    }

    return () => {
      if (channel) {
        unsubscribeFromChannel(selectedChannel?.id || '');
      }
    };
  }, [selectedChannel]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async () => {
    try {
      const response = await fetch('/api/channels');
      const data = await response.json();
      setChannels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadChannelMessages = async (channelId: string) => {
    try {
      const response = await fetch(`/api/channels/${channelId}/messages`);
      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load channel messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      if (selectedConversation) {
        const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newMessage }),
        });
        const data = await response.json();
        setMessages([...messages, data]);
      } else if (selectedChannel) {
        const response = await fetch(`/api/channels/${selectedChannel.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newMessage }),
        });
        const data = await response.json();
        setMessages([...messages, data]);
      }
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const createChannel = async () => {
    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChannelName,
          description: newChannelDescription,
        }),
      });
      if (response.ok) {
        loadChannels();
        setShowNewChannel(false);
        setNewChannelName('');
        setNewChannelDescription('');
      }
    } catch (error) {
      console.error('Failed to create channel:', error);
    }
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    const otherParticipant = conversation.participants.find(
      (p) => p.user.id !== user?.id
    );
    return otherParticipant?.user.name || 'Unknown';
  };

  if (loading) {
    return (
      <DashboardLayout activeTab="messages">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="messages">
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        {/* Sidebar */}
        <div className="w-80 bg-white rounded-lg border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setActiveTab('direct')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                  activeTab === 'direct'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Direct
              </button>
              <button
                onClick={() => setActiveTab('channels')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                  activeTab === 'channels'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Hash className="w-4 h-4 inline mr-2" />
                Channels
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {activeTab === 'direct' ? (
              <>
                <button
                  onClick={() => setShowNewConversation(!showNewConversation)}
                  className="w-full flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 transition text-gray-700"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">New Message</span>
                </button>

                {showNewConversation && (
                  <div className="p-3 bg-gray-50 rounded-lg mb-2">
                    <input
                      type="text"
                      placeholder="Enter user email..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          // TODO: Search and add user
                        }
                      }}
                    />
                  </div>
                )}

                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      setSelectedChannel(null);
                      loadMessages(conversation.id);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-gray-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {getConversationName(conversation).charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {getConversationName(conversation)}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.messages[0]?.sender.name}: {conversation.messages[0]?.content || 'No messages'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowNewChannel(!showNewChannel)}
                  className="w-full flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 transition text-gray-700"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">New Channel</span>
                </button>

                {showNewChannel && (
                  <div className="p-3 bg-gray-50 rounded-lg mb-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Channel name"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newChannelDescription}
                      onChange={(e) => setNewChannelDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      onClick={createChannel}
                      className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition"
                    >
                      Create Channel
                    </button>
                  </div>
                )}

                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setSelectedChannel(channel);
                      setSelectedConversation(null);
                      loadChannelMessages(channel.id);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedChannel?.id === channel.id
                        ? 'bg-gray-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Hash className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{channel.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {channel.messages[0]?.sender.name}: {channel.messages[0]?.content || 'No messages'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
          {(selectedConversation || selectedChannel) ? (
            <>
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">
                  {selectedConversation
                    ? getConversationName(selectedConversation)
                    : selectedChannel?.name}
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user?.id
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>Select a conversation or channel to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
