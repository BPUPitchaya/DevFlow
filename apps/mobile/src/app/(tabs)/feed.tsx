import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../lib/store';
import { standupsApi } from '../../lib/api';
import { format } from 'date-fns';

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
  };
  comments: any[];
  reactions: any[];
}

export default function FeedScreen() {
  const user = useAuthStore((state) => state.user);
  const [standups, setStandups] = useState<Standup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStandups();
  }, []);

  const loadStandups = async () => {
    try {
      const response = await standupsApi.getStandups({ teamId: user?.team?.id });
      setStandups(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load standups');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team Activity</Text>
        <Text style={styles.headerSubtitle}>{standups.length} updates</Text>
      </View>

      {standups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No standups yet</Text>
        </View>
      ) : (
        standups.map((standup) => (
          <View key={standup.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {standup.user.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{standup.user.name}</Text>
                <Text style={styles.dateText}>
                  {format(new Date(standup.date), 'MMM d, yyyy • h:mm a')}
                </Text>
              </View>
              {standup.isBlocked && (
                <View style={styles.blockedBadge}>
                  <Text style={styles.blockedText}>Blocked</Text>
                </View>
              )}
            </View>

            <View style={styles.cardContent}>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Completed Yesterday</Text>
                <Text style={styles.sectionText}>{standup.completed}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Focus Today</Text>
                <Text style={styles.sectionText}>{standup.focus}</Text>
              </View>

              {standup.blockers && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Blockers</Text>
                  <Text style={styles.sectionText}>{standup.blockers}</Text>
                </View>
              )}
            </View>

            <View style={styles.cardFooter}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>
                  💬 {standup.comments.length}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>
                  ❤️ {standup.reactions.length}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    color: '#374151',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  blockedBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  blockedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  cardContent: {
    gap: 12,
  },
  section: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  sectionText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
