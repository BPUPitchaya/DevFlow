'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/lib/store';
import { MessageSquare, Hash, Plus, Search, Smile, MoreVertical, Edit2, Trash2, Reply } from 'lucide-react';
import { subscribeToConversation, unsubscribeFromConversation, subscribeToChannel, unsubscribeFromChannel } from '@/lib/pusher';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { getAvatarColor, getAvatarTextColor } from '@/lib/avatar';
import { formatRelativeTime } from '@/lib/time';

interface Conversation {
  id: string;
  type: string;
  name?: string;
  unreadCount?: number;
  participants: {
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
      lastSeenAt?: string | null;
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
  const darkMode = useAuthStore((state) => state.darkMode);
  const { showToast } = useToast();
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
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [messageReactions, setMessageReactions] = useState<Record<string, any[]>>({});
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showGroupConversation, setShowGroupConversation] = useState(false);
  const [groupConversationName, setGroupConversationName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [searchMessages, setSearchMessages] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

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
        onTypingIndicator: (data) => {
          if (data.userId !== user?.id) {
            setTypingUsers((prev) => {
              const exists = prev.find((u) => u.id === data.userId);
              if (exists) {
                return prev.map((u) => (u.id === data.userId ? { ...u, lastTypedAt: new Date() } : u));
              }
              return [...prev, { id: data.userId, lastTypedAt: new Date() }];
            });
          }
        },
        onMessageUpdated: (data) => {
          setMessages((prev) => prev.map((m) => m.id === data.id ? data : m));
        },
        onMessageDeleted: (data) => {
          setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
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

  useEffect(() => {
    // Update last seen timestamp every minute
    const interval = setInterval(() => {
      fetch('/api/users/last-seen', { method: 'POST' });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Filter messages based on search
    if (searchMessages.trim()) {
      const filtered = messages.filter((m) =>
        m.content.toLowerCase().includes(searchMessages.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [searchMessages, messages]);

  useEffect(() => {
    // Clean up old typing indicators (older than 5 seconds)
    const interval = setInterval(() => {
      setTypingUsers((prev) => {
        const fiveSecondsAgo = new Date(Date.now() - 5000);
        return prev.filter((u) => u.lastTypedAt > fiveSecondsAgo);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const sendTypingIndicator = async () => {
    if (!selectedConversation) return;

    try {
      await fetch(`/api/conversations/${selectedConversation.id}/typing`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  };

  const editMessage = async (messageId: string) => {
    if (!selectedConversation || !editContent.trim()) return;

    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      const data = await response.json();
      setMessages((prev) => prev.map((m) => m.id === data.id ? data : m));
      setEditingMessage(null);
      setEditContent('');
      showToast('Message updated', 'success');
    } catch (error) {
      console.error('Failed to edit message:', error);
      showToast('Failed to edit message', 'error');
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!selectedConversation) return;

    try {
      await fetch(`/api/conversations/${selectedConversation.id}/messages/${messageId}`, {
        method: 'DELETE',
      });
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      showToast('Message deleted', 'success');
    } catch (error) {
      console.error('Failed to delete message:', error);
      showToast('Failed to delete message', 'error');
    }
  };

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
      
      // Load reactions for each message
      if (Array.isArray(data)) {
        for (const message of data) {
          loadReactions(conversationId, message.id);
        }
      }
      
      // Load typing indicators
      const typingResponse = await fetch(`/api/conversations/${conversationId}/typing`);
      const typingData = await typingResponse.json();
      setTypingUsers(Array.isArray(typingData) ? typingData.map((t: any) => ({ id: t.userId, lastTypedAt: new Date() })) : []);
      
      // Update last read timestamp
      try {
        await fetch(`/api/conversations/${conversationId}/read`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Failed to update last read:', error);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadReactions = async (conversationId: string, messageId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages/${messageId}/reactions`);
      const data = await response.json();
      setMessageReactions(prev => ({
        ...prev,
        [messageId]: Array.isArray(data) ? data : []
      }));
    } catch (error) {
      console.error('Failed to load reactions:', error);
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!selectedConversation) return;

    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      const data = await response.json();
      
      if (data.action === 'added') {
        setMessageReactions(prev => ({
          ...prev,
          [messageId]: [...(prev[messageId] || []), data.reaction]
        }));
      } else {
        setMessageReactions(prev => ({
          ...prev,
          [messageId]: (prev[messageId] || []).filter((r: any) => !(r.userId === user?.id && r.emoji === emoji))
        }));
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
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
          body: JSON.stringify({ 
            content: newMessage,
            parentMessageId: replyingTo,
          }),
        });
        const data = await response.json();
        setMessages([...messages, data]);
        setNewMessage('');
        setReplyingTo(null);
        showToast('Message sent', 'success');
      } else if (selectedChannel) {
        const response = await fetch(`/api/channels/${selectedChannel.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newMessage }),
        });
        const data = await response.json();
        setMessages([...messages, data]);
        setNewMessage('');
        showToast('Message sent', 'success');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      showToast('Failed to send message', 'error');
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
        showToast('Channel created', 'success');
      } else {
        showToast('Failed to create channel', 'error');
      }
    } catch (error) {
      console.error('Failed to create channel:', error);
      showToast('Failed to create channel', 'error');
    }
  };

  const isUserOnline = (lastSeenAt: string | null | undefined) => {
    if (!lastSeenAt) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeenAt) > fiveMinutesAgo;
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    const otherParticipant = conversation.participants.find(
      (p) => p.user.id !== user?.id
    );
    return otherParticipant?.user.name || 'Unknown';
  };

  const searchUsers = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(Array.isArray(data) ? data.filter((u: any) => u.id !== user?.id) : []);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const startConversation = async (participantId: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'direct',
          participantIds: [participantId],
        }),
      });
      const data = await response.json();
      loadConversations();
      setSelectedConversation(data);
      setShowNewConversation(false);
      setSearchResults([]);
      setSearchQuery('');
      loadMessages(data.id);
      showToast('Conversation started', 'success');
    } catch (error) {
      console.error('Failed to start conversation:', error);
      showToast('Failed to start conversation', 'error');
    }
  };

  const createGroupConversation = async () => {
    if (!groupConversationName.trim() || selectedParticipants.length === 0) return;

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'group',
          name: groupConversationName,
          participantIds: selectedParticipants,
        }),
      });
      const data = await response.json();
      setShowGroupConversation(false);
      setGroupConversationName('');
      setSelectedParticipants([]);
      loadConversations();
      setSelectedConversation(data);
      loadMessages(data.id);
      showToast('Group conversation created', 'success');
    } catch (error) {
      console.error('Failed to create group conversation:', error);
      showToast('Failed to create group conversation', 'error');
    }
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
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
        <div className={cn("w-80 rounded-lg border flex flex-col", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
          <div className={cn("p-4 border-b", darkMode ? "border-gray-700" : "border-gray-200")}>
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setActiveTab('direct')}
                className={cn("flex-1 py-2 px-3 rounded-lg text-sm font-medium transition", 
                  activeTab === 'direct'
                    ? 'bg-gray-900 text-white'
                    : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Direct
              </button>
              <button
                onClick={() => setActiveTab('channels')}
                className={cn("flex-1 py-2 px-3 rounded-lg text-sm font-medium transition",
                  activeTab === 'channels'
                    ? 'bg-gray-900 text-white'
                    : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <Hash className="w-4 h-4 inline mr-2" />
                Channels
              </button>
            </div>

            <div className="relative">
              <Search className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4", darkMode ? "text-gray-500" : "text-gray-400")} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn("w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500",
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "border-gray-300"
                )}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {activeTab === 'direct' ? (
              <>
                <button
                  onClick={() => setShowNewConversation(!showNewConversation)}
                  className={cn("w-full flex items-center space-x-2 p-3 rounded-lg transition", darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100")}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">New Message</span>
                </button>

                <button
                  onClick={() => setShowGroupConversation(!showGroupConversation)}
                  className={cn("w-full flex items-center space-x-2 p-3 rounded-lg transition", darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100")}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">New Group</span>
                </button>

                {showNewConversation && (
                  <div className={cn("p-3 rounded-lg mb-2 space-y-2", darkMode ? "bg-gray-700" : "bg-gray-50")}>
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      className={cn("w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500",
                        darkMode
                          ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                          : "border-gray-300"
                      )}
                    />
                    {searchResults.length > 0 && (
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {searchResults.map((searchUser) => (
                          <button
                            key={searchUser.id}
                            onClick={() => startConversation(searchUser.id)}
                            className={cn("w-full flex items-center space-x-2 p-2 rounded transition text-left", darkMode ? "hover:bg-gray-600" : "hover:bg-gray-100")}
                          >
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", getAvatarColor(searchUser.name))}>
                              <span className={cn("text-xs font-medium", getAvatarTextColor(getAvatarColor(searchUser.name)))}>
                                {searchUser.name.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium truncate", darkMode ? "text-white" : "text-gray-900")}>{searchUser.name}</p>
                              <p className={cn("text-xs truncate", darkMode ? "text-gray-400" : "text-gray-500")}>{searchUser.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {showGroupConversation && (
                  <div className={cn("p-3 rounded-lg mb-2 space-y-2", darkMode ? "bg-gray-700" : "bg-gray-50")}>
                    <input
                      type="text"
                      placeholder="Group name"
                      value={groupConversationName}
                      onChange={(e) => setGroupConversationName(e.target.value)}
                      className={cn("w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500",
                        darkMode
                          ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                          : "border-gray-300"
                      )}
                    />
                    <input
                      type="text"
                      placeholder="Search users to add..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      className={cn("w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500",
                        darkMode
                          ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                          : "border-gray-300"
                      )}
                    />
                    {searchResults.length > 0 && (
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {searchResults.map((searchUser) => (
                          <button
                            key={searchUser.id}
                            onClick={() => toggleParticipant(searchUser.id)}
                            className={cn("w-full flex items-center space-x-2 p-2 rounded transition text-left",
                              selectedParticipants.includes(searchUser.id)
                                ? darkMode ? "bg-gray-600" : "bg-gray-200"
                                : darkMode ? "hover:bg-gray-600" : "hover:bg-gray-100"
                            )}
                          >
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", getAvatarColor(searchUser.name))}>
                              <span className={cn("text-xs font-medium", getAvatarTextColor(getAvatarColor(searchUser.name)))}>
                                {searchUser.name.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium truncate", darkMode ? "text-white" : "text-gray-900")}>{searchUser.name}</p>
                              <p className={cn("text-xs truncate", darkMode ? "text-gray-400" : "text-gray-500")}>{searchUser.email}</p>
                            </div>
                            {selectedParticipants.includes(searchUser.id) && (
                              <span className="text-green-500">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedParticipants.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {selectedParticipants.length} participant{selectedParticipants.length > 1 ? 's' : ''} selected
                      </div>
                    )}
                    <button
                      onClick={createGroupConversation}
                      disabled={!groupConversationName.trim() || selectedParticipants.length === 0}
                      className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Group
                    </button>
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
                    className={cn("w-full text-left p-3 rounded-lg transition",
                      selectedConversation?.id === conversation.id
                        ? darkMode ? "bg-gray-700" : "bg-gray-100"
                        : darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", getAvatarColor(getConversationName(conversation)))}>
                          <span className={cn("text-sm font-medium", getAvatarTextColor(getAvatarColor(getConversationName(conversation))))}>
                            {getConversationName(conversation).charAt(0)}
                          </span>
                        </div>
                        {conversation.type === 'direct' && (() => {
                          const otherParticipant = conversation.participants.find((p) => p.user.id !== user?.id);
                          return otherParticipant && isUserOnline(otherParticipant.user.lastSeenAt) ? (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          ) : null;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium text-sm truncate", darkMode ? "text-white" : "text-gray-900")}>
                          {getConversationName(conversation)}
                        </p>
                        <p className={cn("text-xs truncate", darkMode ? "text-gray-400" : "text-gray-500")}>
                          {conversation.messages[0]?.sender.name}: {conversation.messages[0]?.content || 'No messages'}
                        </p>
                      </div>
                      {conversation.unreadCount && conversation.unreadCount > 0 && (
                        <div className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowNewChannel(!showNewChannel)}
                  className={cn("w-full flex items-center space-x-2 p-3 rounded-lg transition", darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100")}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">New Channel</span>
                </button>

                {showNewChannel && (
                  <div className={cn("p-3 rounded-lg mb-2 space-y-2", darkMode ? "bg-gray-700" : "bg-gray-50")}>
                    <input
                      type="text"
                      placeholder="Channel name"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      className={cn("w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500",
                        darkMode
                          ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                          : "border-gray-300"
                      )}
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newChannelDescription}
                      onChange={(e) => setNewChannelDescription(e.target.value)}
                      className={cn("w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500",
                        darkMode
                          ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                          : "border-gray-300"
                      )}
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
                    className={cn("w-full text-left p-3 rounded-lg transition",
                      selectedChannel?.id === channel.id
                        ? darkMode ? "bg-gray-700" : "bg-gray-100"
                        : darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", darkMode ? "bg-blue-900" : "bg-blue-100")}>
                        <Hash className={cn("w-5 h-5", darkMode ? "text-blue-400" : "text-blue-600")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium text-sm", darkMode ? "text-white" : "text-gray-900")}>{channel.name}</p>
                        <p className={cn("text-xs truncate", darkMode ? "text-gray-400" : "text-gray-500")}>
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
        <div className={cn("flex-1 rounded-lg border flex flex-col", darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
          {(selectedConversation || selectedChannel) ? (
            <>
              <div className={cn("p-4 border-b", darkMode ? "border-gray-700" : "border-gray-200")}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={cn("font-semibold", darkMode ? "text-white" : "text-gray-900")}>
                    {selectedConversation
                      ? getConversationName(selectedConversation)
                      : selectedChannel?.name}
                  </h3>
                </div>
                <div className="relative">
                  <Search className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4", darkMode ? "text-gray-500" : "text-gray-400")} />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchMessages}
                    onChange={(e) => setSearchMessages(e.target.value)}
                    className={cn("w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500",
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "border-gray-300"
                    )}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {filteredMessages.length === 0 && searchMessages ? (
                  <div className="text-center text-gray-500 py-8">
                    No messages found matching "{searchMessages}"
                  </div>
                ) : (
                  filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={cn("max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                        message.senderId === user?.id
                          ? "bg-gray-900 text-white"
                          : darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"
                      )}
                    >
                      {editingMessage === message.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && editMessage(message.id)}
                            className={cn("w-full px-2 py-1 rounded text-sm outline-none",
                              darkMode ? "bg-gray-600 text-white" : "bg-white text-gray-900"
                            )}
                            autoFocus
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => editMessage(message.id)}
                              className="text-xs bg-green-500 px-2 py-1 rounded hover:bg-green-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingMessage(null);
                                setEditContent('');
                              }}
                              className="text-xs bg-gray-500 px-2 py-1 rounded hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {message.parentMessage && (
                            <div className={cn("text-xs p-2 mb-2 rounded border-l-2", darkMode ? "bg-gray-600 border-gray-500 text-gray-300" : "bg-gray-100 border-gray-300 text-gray-600")}>
                              <span className="font-medium">{message.parentMessage.sender.name}:</span> {message.parentMessage.content}
                            </div>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {formatRelativeTime(message.createdAt)}
                          </p>
                          
                          {/* Reactions */}
                          {messageReactions[message.id] && messageReactions[message.id].length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {messageReactions[message.id].map((reaction: any) => (
                                <span
                                  key={reaction.id}
                                  className="text-xs px-2 py-1 rounded-full bg-white/20"
                                  title={reaction.user.name}
                                >
                                  {reaction.emoji}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Message actions */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => toggleReaction(message.id, '👍')}
                                className="text-xs opacity-50 hover:opacity-100 transition"
                                title="React"
                              >
                                <Smile className="w-4 h-4 inline" />
                              </button>
                              <button
                                onClick={() => setReplyingTo(message.id)}
                                className="text-xs opacity-50 hover:opacity-100 transition"
                                title="Reply"
                              >
                                <Reply className="w-4 h-4 inline" />
                              </button>
                            </div>
                            {message.senderId === user?.id && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingMessage(message.id);
                                    setEditContent(message.content);
                                  }}
                                  className="text-xs opacity-50 hover:opacity-100 transition"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3 h-3 inline" />
                                </button>
                                <button
                                  onClick={() => deleteMessage(message.id)}
                                  className="text-xs opacity-50 hover:opacity-100 transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3 inline" />
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
                )}
              </div>

              <div className={cn("p-4 border-t", darkMode ? "border-gray-700" : "border-gray-200")}>
                {typingUsers.length > 0 && (
                  <div className="text-xs text-gray-500 mb-2">
                    {typingUsers.length === 1 ? 'Someone is typing...' : `${typingUsers.length} people are typing...`}
                  </div>
                )}
                {replyingTo && (
                  <div className={cn("flex items-center justify-between p-2 mb-2 rounded text-sm", darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700")}>
                    <span>Replying to message...</span>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      sendTypingIndicator();
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className={cn("flex-1 px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500",
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "border-gray-300"
                    )}
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
            <div className="flex-1 flex items-center justify-center">
              <p className={darkMode ? "text-gray-400" : "text-gray-500"}>Select a conversation or channel to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
