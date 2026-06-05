import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/store';
import { standupsApi } from '../../lib/api';

export default function StandupScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [completed, setCompleted] = useState('');
  const [focus, setFocus] = useState('');
  const [blockers, setBlockers] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!completed || !focus) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    if (isBlocked && !blockers) {
      Alert.alert('Error', 'Please describe the blockers');
      return;
    }

    setLoading(true);
    try {
      await standupsApi.createStandup({
        completed,
        focus,
        blockers: isBlocked ? blockers : undefined,
        isBlocked,
      });
      Alert.alert('Success', 'Standup submitted successfully');
      router.replace('/(tabs)/feed');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Standup</Text>
        <Text style={styles.subtitle}>
          Share your progress in under 60 seconds
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>
            Completed Yesterday <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textarea}
            placeholder="What did you accomplish yesterday?"
            value={completed}
            onChangeText={setCompleted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            Focus Today <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textarea}
            placeholder="What are you working on today?"
            value={focus}
            onChangeText={setFocus}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>I have blockers</Text>
            <Switch
              value={isBlocked}
              onValueChange={setIsBlocked}
              trackColor={{ false: '#d1d5db', true: '#dc2626' }}
            />
          </View>
        </View>

        {isBlocked && (
          <View style={styles.field}>
            <Text style={styles.label}>
              Describe Blockers <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textarea, styles.blockerInput]}
              placeholder="What's blocking your progress?"
              value={blockers}
              onChangeText={setBlockers}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.warning}>
              ⚠️ This will notify your team immediately
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Submitting...' : 'Submit Standup'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  form: {
    padding: 16,
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  required: {
    color: '#dc2626',
  },
  textarea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockerInput: {
    borderColor: '#dc2626',
  },
  warning: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
