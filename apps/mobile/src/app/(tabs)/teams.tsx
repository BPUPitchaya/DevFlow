import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/store';

interface Team {
  id: string;
  name: string;
  description?: string;
  _count: {
    members: number;
  };
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  dueDate?: string;
  tags: string[];
}

const mockTeams: Team[] = [
  { id: 't1', name: 'Engineering Team', description: 'Core development team', _count: { members: 8 } },
  { id: 't2', name: 'Design Team', description: 'UI/UX design team', _count: { members: 4 } },
  { id: 't3', name: 'Marketing Team', description: 'Marketing and growth', _count: { members: 5 } },
  { id: 't4', name: 'Operations Team', description: 'Operations and support', _count: { members: 3 } },
];

const mockTeamMembers: Record<string, TeamMember[]> = {
  't1': [
    { id: 'u1', name: 'John Doe', email: 'john@example.com', role: 'LEAD_ENGINEER' },
    { id: 'u2', name: 'Jane Smith', email: 'jane@example.com', role: 'SENIOR_ENGINEER' },
    { id: 'u3', name: 'Bob Wilson', email: 'bob@example.com', role: 'FRONTEND_DEVELOPER' },
  ],
  't2': [
    { id: 'u5', name: 'Grace Lee', email: 'grace@example.com', role: 'DESIGN_LEAD' },
  ],
};

const mockProjects: Record<string, Project[]> = {
  't1': [
    {
      id: 'p1',
      name: 'Website Redesign',
      description: 'Complete overhaul of company website',
      status: 'In Progress',
      priority: 'High',
      progress: 65,
      dueDate: '2024-12-31',
      tags: ['frontend', 'design'],
    },
    {
      id: 'p2',
      name: 'Mobile App',
      description: 'React Native mobile application',
      status: 'Planning',
      priority: 'Medium',
      progress: 20,
      tags: ['mobile', 'react-native'],
    },
  ],
};

export default function TeamsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isDemo = useAuthStore((state) => state.isDemo);
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Record<string, Project[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  useEffect(() => {
    if (isDemo) {
      setTeams(mockTeams);
      setProjects(mockProjects);
    }
    setLoading(false);
  }, [isDemo]);

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) {
      Alert.alert('Error', 'Please enter a team name');
      return;
    }

    const newTeam: Team = {
      id: `t${Date.now()}`,
      name: newTeamName,
      description: newTeamDescription,
      _count: { members: 1 },
    };

    setTeams([...teams, newTeam]);
    setNewTeamName('');
    setNewTeamDescription('');
    setShowCreateModal(false);
    Alert.alert('Success', 'Team created successfully');
  };

  const canCreateTeam = user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'PROJECT_MANAGER' || user?.role === 'LEAD_ENGINEER';

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  if (selectedTeam) {
    const teamMembers = mockTeamMembers[selectedTeam.id] || [];
    const teamProjects = projects[selectedTeam.id] || [];

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedTeam(null)} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedTeam.name}</Text>
        </View>

        <ScrollView style={styles.content}>
          {selectedTeam.description && (
            <Text style={styles.description}>{selectedTeam.description}</Text>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>👥</Text>
              <Text style={styles.sectionTitle}>Team Members ({teamMembers.length})</Text>
            </View>
            {teamMembers.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{member.name.charAt(0)}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                </View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{member.role.replace('_', ' ')}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📅</Text>
              <Text style={styles.sectionTitle}>Projects ({teamProjects.length})</Text>
            </View>
            {teamProjects.map((project) => (
              <View key={project.id} style={styles.projectCard}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  <View style={[styles.priorityBadge, project.priority === 'High' ? styles.priorityHigh : project.priority === 'Medium' ? styles.priorityMedium : styles.priorityLow]}>
                    <Text style={styles.priorityText}>{project.priority}</Text>
                  </View>
                </View>
                <Text style={styles.projectDescription}>{project.description}</Text>
                <View style={styles.projectMeta}>
                  <Text style={styles.projectStatus}>{project.status}</Text>
                  <Text style={styles.projectProgress}>{project.progress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${project.progress}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Teams</Text>
        {canCreateTeam && (
          <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {teams.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No teams yet</Text>
            {canCreateTeam && (
              <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.createButton}>
                <Text style={styles.createButtonText}>Create Team</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          teams.map((team) => (
            <TouchableOpacity
              key={team.id}
              onPress={() => setSelectedTeam(team)}
              style={styles.teamCard}
            >
              <View style={styles.teamHeader}>
                <Text style={styles.teamName}>{team.name}</Text>
                {team.description && (
                  <Text style={styles.teamDescription}>{team.description}</Text>
                )}
              </View>
              <View style={styles.teamFooter}>
                <View style={styles.memberCount}>
                  <Text style={styles.memberCountIcon}>👥</Text>
                  <Text style={styles.memberCountText}>{team._count.members} members</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Team</Text>
            <TextInput
              style={styles.input}
              placeholder="Team Name"
              value={newTeamName}
              onChangeText={setNewTeamName}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={newTeamDescription}
              onChangeText={setNewTeamDescription}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setNewTeamName('');
                  setNewTeamDescription('');
                }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateTeam} style={styles.confirmButton}>
                <Text style={styles.confirmButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#111827',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  memberEmail: {
    fontSize: 12,
    color: '#6b7280',
  },
  roleBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 12,
    color: '#6b7280',
  },
  projectCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityHigh: {
    backgroundColor: '#fef2f2',
  },
  priorityMedium: {
    backgroundColor: '#fef9c3',
  },
  priorityLow: {
    backgroundColor: '#f3f4f6',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  projectDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  projectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  projectStatus: {
    fontSize: 12,
    color: '#6b7280',
  },
  projectProgress: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#111827',
    borderRadius: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  createButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  teamCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  teamHeader: {
    marginBottom: 8,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  teamDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  teamFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCountIcon: {
    fontSize: 16,
  },
  memberCountText: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
